from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import datetime

app = Flask(__name__)
CORS(app)

# Helper function to get a database connection
def get_db_connection():
    return psycopg2.connect(
        dbname="finance_os",
        user="finance_admin",
        password="admin123",
        host="127.0.0.1",
        port="5432"
    )

@app.route('/api/overview', methods=['GET'])
def get_overview_data():
    conn = get_db_connection()
    # RealDictCursor formats the SQL rows into Python dictionaries automatically
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch User details
    cursor.execute("SELECT * FROM users WHERE id = 1;")
    user_record = cursor.fetchone()
    
    # Fetch Total Debt by summing up the debts table
    cursor.execute("SELECT SUM(balance) as total_debt FROM debts WHERE user_id = 1;")
    debt_record = cursor.fetchone()
    
    cursor.close()
    conn.close()

    # Construct the payload for React
    data = {
        "userName": user_record['username'],
        "netWorth": float(user_record['net_worth']),
        "monthlyCashFlow": float(user_record['monthly_cash_flow']),
        "totalDebt": float(debt_record['total_debt']) if debt_record['total_debt'] else 0,
        # We will keep the chart data hardcoded for one more step until we build the Transactions table!
        "chartData": [
            { "month": "Oct", "income": 95000, "expenses": 72000 },
            { "month": "Nov", "income": 95000, "expenses": 68000 },
            { "month": "Dec", "income": 110000, "expenses": 85000 },
            { "month": "Jan", "income": 95000, "expenses": 65000 },
            { "month": "Feb", "income": 95000, "expenses": 70000 },
            { "month": "Mar", "income": 100000, "expenses": 70000 }
        ]
    }
    
    return jsonify(data)


@app.route('/api/debts', methods=['GET'])
def get_debts_data():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch all individual debts for user 1
    cursor.execute("SELECT * FROM debts WHERE user_id = 1 ORDER BY balance DESC;")
    debts_records = cursor.fetchall()
    
    cursor.close()
    conn.close()

    # Convert the Decimal types from Postgres to standard Python floats for JSON
    formatted_debts = []
    for debt in debts_records:
        formatted_debts.append({
            "id": debt['id'],
            "name": debt['debt_name'],
            "balance": float(debt['balance']),
            "interestRate": float(debt['interest_rate']),
            "originalAmount": float(debt['original_amount']) if debt['original_amount'] else float(debt['balance']),
            "monthlyEmi": float(debt['monthly_emi']) if debt['monthly_emi'] else 0,
            "status": debt['status'] if debt['status'] else 'active',
            "payoffNote": debt['payoff_note']
        })
        
    return jsonify(formatted_debts)


@app.route('/api/debts', methods=['POST'])
def add_debt():
    # 1. Catch the incoming JSON payload from React
    new_debt = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 2. Write the SQL to insert the new record
    # We use %s as placeholders to prevent SQL injection attacks!
    insert_query = """
        INSERT INTO debts (user_id, debt_name, balance, interest_rate, original_amount, monthly_emi)
        VALUES (1, %s, %s, %s, %s, %s)
    """
    
    # 3. Execute the SQL with the actual data
    cursor.execute(insert_query, (new_debt['name'], new_debt['balance'], new_debt['interestRate'], new_debt['originalAmount'], new_debt['monthlyEmi']))
    
    # 4. Commit (save) the changes and close the connection
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Debt added successfully!"}), 201


@app.route('/api/debts/<int:debt_id>', methods=['DELETE'])
def delete_debt(debt_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM debts WHERE id = %s", (debt_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Debt permanently deleted"}), 200


# Route to celebrate a payoff (Soft Delete + Note)
@app.route('/api/debts/<int:debt_id>/payoff', methods=['PUT'])
def payoff_debt(debt_id):
    note = request.json.get('note', '')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE debts 
        SET status = 'paid', payoff_note = %s, balance = 0 
        WHERE id = %s
    """, (note, debt_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Debt marked as paid in full!"}), 200


@app.route('/api/transactions', methods=['GET', 'POST', 'OPTIONS'])
def handle_transactions():
    # Handle the CORS preflight scout packet
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    conn = get_db_connection()
    
    # --- GET: Fetching Data for React ---
    if request.method == 'GET':
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Fetch the 50 most recent transactions, newest first
        cursor.execute("SELECT * FROM transactions WHERE user_id = 1 ORDER BY date DESC LIMIT 50;")
        records = cursor.fetchall()
        
        formatted_transactions = []
        for r in records:
            formatted_transactions.append({
                "id": r['id'],
                "type": r['type'],
                "amount": float(r['amount']),
                "category": r['category'],
                "description": r['description'],
                # Dates must be converted to strings for JSON!
                "date": r['date'].strftime('%Y-%m-%d') if r['date'] else ''
            })
            
        cursor.close()
        conn.close()
        return jsonify(formatted_transactions)

    # --- POST: Saving Data from React ---
    elif request.method == 'POST':
        data = request.json
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (user_id, type, amount, category, description, date)
            VALUES (1, %s, %s, %s, %s, %s)
        """, (data['type'], data['amount'], data['category'], data['description'], data['date']))
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Transaction logged successfully"}), 201

        

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)