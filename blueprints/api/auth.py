from flask import request, jsonify
from backend.blueprints.api import api_bp
from backend.services.auth_service import AuthService
from backend.models import db
from backend.utils.validators import validate_username, sanitize_string

@api_bp.route('/auth/register/passkey', methods=['POST'])
def register_passkey():
    data = request.get_json()
    
    username = sanitize_string(data.get('username', ''))
    passkey_credential = data.get('passkey_credential', '')
    
    valid, error = validate_username(username)
    if not valid:
        return jsonify({'error': error}), 400
    
    if not passkey_credential:
        return jsonify({'error': 'Passkey credential is required'}), 400
    
    user, error = AuthService.register_passkey(username, passkey_credential.encode())
    
    if error:
        return jsonify({'error': error}), 409
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Passkey registered successfully',
        'user_id': user.id,
        'username': user.username
    }), 201

@api_bp.route('/auth/register/totp', methods=['POST'])
def register_totp():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    from backend.models import User
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    totp_secret, qr_code = AuthService.setup_totp(user)
    db.session.commit()
    
    return jsonify({
        'message': 'TOTP setup successfully',
        'totp_secret': totp_secret,
        'qr_code': qr_code
    }), 200

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    username = sanitize_string(data.get('username', ''))
    passkey_credential = data.get('passkey_credential', '')
    totp_code = data.get('totp_code', '')
    
    if not username or not passkey_credential or not totp_code:
        return jsonify({'error': 'Username, passkey, and TOTP code are required'}), 400
    
    user, error = AuthService.verify_passkey(username, passkey_credential.encode())
    
    if error:
        return jsonify({'error': error}), 401
    
    totp_valid = AuthService.verify_totp(user, totp_code)
    
    if not totp_valid:
        return jsonify({'error': 'Invalid TOTP code'}), 401
    
    token, expires = AuthService.create_session(user)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'expires_at': expires.isoformat(),
        'user_id': user.id,
        'username': user.username
    }), 200

@api_bp.route('/auth/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
    
    success = AuthService.invalidate_session(token)
    
    if success:
        return jsonify({'message': 'Logout successful'}), 200
    else:
        return jsonify({'error': 'Invalid token'}), 400

@api_bp.route('/auth/session', methods=['GET'])
def validate_session():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 401
    
    user, error = AuthService.validate_session(token)
    
    if error:
        return jsonify({'error': error}), 401
    
    return jsonify({
        'valid': True,
        'user_id': user.id,
        'username': user.username
    }), 200
