from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os

app = Flask(__name__)
CORS(app)

DATA_FILE = 'db.json'
ADMIN_PASSWORD = "admin123"

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'orders': [], 'users': []}

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/api/order', methods=['POST'])
def create_order():
    try:
        data = request.json
        db = load_data()
        order_id = len(db['orders']) + 1
        order = {
            'id': order_id,
            'items': data.get('items', []),
            'total': data.get('total', 0),
            'name': data.get('name'),
            'phone': data.get('phone'),
            'address': data.get('address'),
            'delivery': data.get('delivery'),
            'comment': data.get('comment', ''),
            'status': 'new'
        }
        db['orders'].append(order)
        save_data(db)
        return jsonify({'success': True, 'orderId': order_id}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    db = load_data()
    for user in db['users']:
        if user['email'] == data['email']:
            return jsonify({'success': False, 'message': 'Этот email уже занят'}), 400
    hashed_password = generate_password_hash(data['password'])
    db['users'].append({'name': data['name'], 'email': data['email'], 'password_hash': hashed_password})
    save_data(db)
    return jsonify({'success': True})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    db = load_data()
    user = next((u for u in db['users'] if u['email'] == data['email']), None)
    if user and check_password_hash(user['password_hash'], data['password']):
        return jsonify({'success': True, 'user': {'name': user['name'], 'email': user['email']}})
    return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    password = data.get('password')
    if password == ADMIN_PASSWORD:
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Неверный пароль администратора'}), 401

# API для просмотра заказов
@app.route('/api/admin/orders', methods=['GET'])
def get_orders():
    db = load_data()
    return jsonify(db['orders'])

# === НОВЫЙ ЭНДПОИНТ ДЛЯ ОБНОВЛЕНИЯ СТАТУСА ===
@app.route('/api/admin/orders/<int:order_id>', methods=['PATCH'])
def update_order(order_id):
    data = request.json
    db = load_data()
    for order in db['orders']:
        if order['id'] == order_id:
            if 'status' in data:
                order['status'] = data['status']
            save_data(db)
            return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Заказ не найден'}), 404

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)