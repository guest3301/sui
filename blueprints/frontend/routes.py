from flask import render_template, redirect, url_for, session, request, jsonify
from backend.blueprints.frontend import frontend_bp
from backend.services.auth_service import AuthService
from backend.models import db, User
from functools import wraps

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = session.get('token')
        
        if not token:
            return redirect(url_for('frontend.login'))
        
        user, error = AuthService.validate_session(token)
        
        if error:
            session.clear()
            return redirect(url_for('frontend.login'))
        
        return f(user, *args, **kwargs)
    
    return decorated_function

@frontend_bp.route('/')
@login_required
def index(user):
    """Dashboard home page"""
    # Pass token to template for API calls
    token = session.get('token')
    return render_template('dashboard.html', user=user, token=token)

@frontend_bp.route('/login')
def login():
    """Login page"""
    # If already logged in, redirect to dashboard
    token = session.get('token')
    if token:
        user, error = AuthService.validate_session(token)
        if not error:
            return redirect(url_for('frontend.index'))
    
    return render_template('login.html')

@frontend_bp.route('/register')
def register():
    """Registration page"""
    # If already logged in, redirect to dashboard
    token = session.get('token')
    if token:
        user, error = AuthService.validate_session(token)
        if not error:
            return redirect(url_for('frontend.index'))
    
    return render_template('register.html')

@frontend_bp.route('/settings')
@login_required
def settings(user):
    """Settings page"""
    token = session.get('token')
    return render_template('settings.html', user=user, token=token)

@frontend_bp.route('/analytics')
@login_required
def analytics(user):
    """Analytics page"""
    token = session.get('token')
    return render_template('analytics.html', user=user, token=token)

@frontend_bp.route('/logout')
def logout():
    """Logout"""
    token = session.get('token')
    if token:
        AuthService.invalidate_session(token)
    
    session.clear()
    return redirect(url_for('frontend.login'))

@frontend_bp.route('/api/frontend/login', methods=['POST'])
def api_login():
    """Frontend login endpoint (sets session cookie)"""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token required'}), 400
    
    # Validate token
    user, error = AuthService.validate_session(token)
    
    if error:
        return jsonify({'error': error}), 401
    
    # Set session
    session['token'] = token
    session['user_id'] = user.id
    session['username'] = user.username
    
    return jsonify({'message': 'Logged in successfully'}), 200

@frontend_bp.route('/api/frontend/check-session', methods=['GET'])
def check_session():
    """Check if user has valid session"""
    token = session.get('token')
    
    if not token:
        return jsonify({'logged_in': False}), 200
    
    user, error = AuthService.validate_session(token)
    
    if error:
        session.clear()
        return jsonify({'logged_in': False}), 200
    
    return jsonify({
        'logged_in': True,
        'user': {
            'id': user.id,
            'username': user.username
        }
    }), 200
