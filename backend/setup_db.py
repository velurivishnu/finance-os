import psycopg2

# 1. Establish the connection string (Like dialing an IP and Port)
conn = psycopg2.connect(
    dbname="finance_os",
    user="finance_admin",
    password="admin123",
    host="127.0.0.1",
    port="5432"
)

# 2. Open a cursor (a workspace to execute commands)
cursor = conn.cursor()

# 3. Write the SQL to create tables
create_tables_query = """
DROP TABLE IF EXISTS debts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    net_worth NUMERIC,
    monthly_cash_flow NUMERIC
);

CREATE TABLE debts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    debt_name VARCHAR(100),
    balance NUMERIC,
    interest_rate NUMERIC
);
"""
cursor.execute(create_tables_query)

# 4. Insert your starting data
insert_data_query = """
INSERT INTO users (username, net_worth, monthly_cash_flow) 
VALUES ('Vishnu', -1250000, 30000);

INSERT INTO debts (user_id, debt_name, balance, interest_rate) 
VALUES 
    (1, 'Home Loan', 1000000, 8.5),
    (1, 'Personal Loan', 200000, 12.0),
    (1, 'Credit Card A', 100000, 36.0);
"""
cursor.execute(insert_data_query)

# 5. Commit the changes and close the connection
conn.commit()
cursor.close()
conn.close()

print("Database 'finance_os' successfully structured and populated!")