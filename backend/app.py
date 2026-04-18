from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable Cross-Origin Resource Sharing so React can fetch data from this API
CORS(app) 

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"message": "Flask Backend is up and running!", "status": 200})

if __name__ == '__main__':
    # Run on port 5000
    app.run(debug=True, port=5000)