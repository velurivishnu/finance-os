import re
import pytesseract
from pdf2image import convert_from_path

def parse_hdfc_ocr(pdf_path, pdf_password=None):
    print(f"📄 Processing {pdf_path} through AI OCR...")
    images = convert_from_path(pdf_path, userpw=pdf_password)
    
    all_text = ""
    for img in images:
        all_text += pytesseract.image_to_string(img) + "\n"

    lines = [line.strip() for line in all_text.split('\n') if line.strip()]
    
    transactions = []
    current_txn = None
    previous_balance = None
    in_footer = False # 👉 NEW: The toggle switch for boilerplate text

    date_pattern = re.compile(r'^(\d{2}/\d{2}/\d{2})\s*(?:\|)?\s*(.*)')
    amount_pattern = re.compile(r'([\d,]+\.\d{2})')

    for line in lines:
        match = date_pattern.match(line)
        
        if match:
            in_footer = False # 👉 NEW: Reset the switch when a new transaction starts!
            
            if current_txn:
                transactions.append(current_txn)
                
            date_str = match.group(1)
            rest_of_line = match.group(2)
            
            amounts = amount_pattern.findall(rest_of_line)
            
            if len(amounts) >= 2:
                balance_str = amounts[-1]
                txn_amount_str = amounts[-2]
                
                balance = float(balance_str.replace(',', ''))
                txn_amount = float(txn_amount_str.replace(',', ''))
                
                txn_type = "expense" 
                if previous_balance is not None:
                    if round(previous_balance + txn_amount, 2) == balance:
                        txn_type = "income"
                    elif round(previous_balance - txn_amount, 2) == balance:
                        txn_type = "expense"
                        
                previous_balance = balance
                
                desc = rest_of_line
                for amt in amounts:
                    desc = desc.replace(amt, '')
                desc = re.sub(r'\d{2}/\d{2}/\d{2}', '', desc) 
                desc = desc.replace('|', '').strip()
                
                current_txn = {
                    "date": date_str,
                    "description": desc,
                    "amount": txn_amount,
                    "type": txn_type,
                    "balance": balance
                }
        else:
            # 👉 NEW: If we hit the legal disclaimer or header, lock the description
            if "*Closing balance includes" in line or "Statement of account" in line or "Contents of this statement" in line or "STATEMENT SUMMARY" in line:
                in_footer = True

            # Add to description ONLY if the footer lock is OFF
            blocklist = ["Date", "Narration", "Closing Balance", "Page No", "HDFC", "Account Branch", "City :", "Cust ID", "Account No", "JOINT HOLDERS"]
            if current_txn and not in_footer and not any(keyword in line for keyword in blocklist):
                clean_line = line.replace('|', '').strip()
                if clean_line:
                    current_txn["description"] += " " + clean_line

    if current_txn:
        transactions.append(current_txn)

    return transactions


if __name__ == "__main__":
    MY_PDF_FILE = "my_bank_statement.pdf" 
    MY_PASSWORD = None  
    
    results = parse_hdfc_ocr(MY_PDF_FILE, MY_PASSWORD)
    
    print("\n✅ EXTRACTION COMPLETE! Here is the clean data ready for PostgreSQL:\n")
    for txn in results:
        print(f"[{txn['date']}] {txn['type'].upper()} | ₹{txn['amount']} | Bal: ₹{txn['balance']} | Desc: {txn['description']}")