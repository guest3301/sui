from flask import request, jsonify
from backend.blueprints.api import api_bp
from backend.services.auth_service import AuthService
from backend.models import db, Settings
from datetime import datetime

def require_auth(f):
    """Decorator to require authentication"""
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        user, error = AuthService.validate_session(token)
        
        if error:
            return jsonify({'error': error}), 401
        
        # Pass user to the wrapped function
        return f(user, *args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@api_bp.route('/settings', methods=['GET'])
@require_auth
def get_settings(user):
    """Get user settings"""
    settings = Settings.query.filter_by(user_id=user.id).first()
    
    # Create default settings if none exist
    if not settings:
        settings = Settings(
            user_id=user.id,
            dark_pattern_sensitivity=0.7,
            doomscroll_time_threshold=300,
            enabled_websites='[]',
            intervention_style='moderate'
        )
        db.session.add(settings)
        db.session.commit()
    
    return jsonify({
        'settings': {
            'dark_pattern_sensitivity': settings.dark_pattern_sensitivity,
            'doomscroll_time_threshold': settings.doomscroll_time_threshold,
            'enabled_websites': settings.get_enabled_websites(),
            'intervention_style': settings.intervention_style,
            'updated_at': settings.updated_at.isoformat()
        },
        'settings_version': user.settings_version
    }), 200

@api_bp.route('/settings', methods=['PUT'])
@require_auth
def update_settings(user):
    """Update user settings"""
    data = request.get_json()
    
    settings = Settings.query.filter_by(user_id=user.id).first()
    
    # Create settings if none exist
    if not settings:
        settings = Settings(user_id=user.id)
        db.session.add(settings)
    
    # Update fields if provided
    if 'dark_pattern_sensitivity' in data:
        sensitivity = data['dark_pattern_sensitivity']
        if not isinstance(sensitivity, (int, float)) or sensitivity < 0 or sensitivity > 1:
            return jsonify({'error': 'dark_pattern_sensitivity must be between 0 and 1'}), 400
        settings.dark_pattern_sensitivity = float(sensitivity)
    
    if 'doomscroll_time_threshold' in data:
        threshold = data['doomscroll_time_threshold']
        if not isinstance(threshold, int) or threshold < 0:
            return jsonify({'error': 'doomscroll_time_threshold must be a positive integer'}), 400
        settings.doomscroll_time_threshold = threshold
    
    if 'enabled_websites' in data:
        websites = data['enabled_websites']
        if not isinstance(websites, list):
            return jsonify({'error': 'enabled_websites must be an array'}), 400
        settings.set_enabled_websites(websites)
    
    if 'intervention_style' in data:
        style = data['intervention_style']
        if style not in ['gentle', 'moderate', 'aggressive']:
            return jsonify({'error': 'intervention_style must be gentle, moderate, or aggressive'}), 400
        settings.intervention_style = style
    
    # Update timestamp
    settings.updated_at = datetime.utcnow()
    
    # Increment settings version for sync
    user.settings_version += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Settings updated successfully',
        'settings': {
            'dark_pattern_sensitivity': settings.dark_pattern_sensitivity,
            'doomscroll_time_threshold': settings.doomscroll_time_threshold,
            'enabled_websites': settings.get_enabled_websites(),
            'intervention_style': settings.intervention_style,
            'updated_at': settings.updated_at.isoformat()
        },
        'settings_version': user.settings_version
    }), 200

@api_bp.route('/settings/sync', methods=['GET'])
@require_auth
def check_settings_sync(user):
    """Check if settings need to be synced"""
    client_version = request.args.get('version', 0, type=int)
    
    needs_sync = client_version < user.settings_version
    
    return jsonify({
        'needs_sync': needs_sync,
        'server_version': user.settings_version,
        'client_version': client_version
    }), 200

# Alias routes for /api/user/settings
@api_bp.route('/user/settings', methods=['GET', 'OPTIONS'])
@require_auth
def get_user_settings_alias(user):
    """Get user settings (alias for /api/settings)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    settings = Settings.query.filter_by(user_id=user.id).first()
    
    # Create default settings if none exist
    if not settings:
        settings = Settings(
            user_id=user.id,
            dark_pattern_sensitivity=0.7,
            doomscroll_time_threshold=300,
            enabled_websites='[]',
            intervention_style='moderate'
        )
        db.session.add(settings)
        db.session.commit()
    
    return jsonify({
        'settings': {
            'dark_pattern_sensitivity': settings.dark_pattern_sensitivity,
            'doomscroll_time_threshold': settings.doomscroll_time_threshold,
            'enabled_websites': settings.get_enabled_websites(),
            'intervention_style': settings.intervention_style,
            'updated_at': settings.updated_at.isoformat()
        },
        'settings_version': user.settings_version
    }), 200

@api_bp.route('/user/settings', methods=['PUT', 'OPTIONS'])
@require_auth
def update_user_settings_alias(user):
    """Update user settings (alias for /api/settings)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    data = request.get_json()
    
    settings = Settings.query.filter_by(user_id=user.id).first()
    
    # Create settings if none exist
    if not settings:
        settings = Settings(user_id=user.id)
        db.session.add(settings)
    
    # Update fields if provided
    if 'dark_pattern_sensitivity' in data:
        sensitivity = data['dark_pattern_sensitivity']
        if not isinstance(sensitivity, (int, float)) or sensitivity < 0 or sensitivity > 1:
            return jsonify({'error': 'dark_pattern_sensitivity must be between 0 and 1'}), 400
        settings.dark_pattern_sensitivity = float(sensitivity)
    
    if 'doomscroll_time_threshold' in data:
        threshold = data['doomscroll_time_threshold']
        if not isinstance(threshold, int) or threshold < 0:
            return jsonify({'error': 'doomscroll_time_threshold must be a positive integer'}), 400
        settings.doomscroll_time_threshold = threshold
    
    if 'enabled_websites' in data:
        websites = data['enabled_websites']
        if not isinstance(websites, list):
            return jsonify({'error': 'enabled_websites must be an array'}), 400
        settings.set_enabled_websites(websites)
    
    if 'intervention_style' in data:
        style = data['intervention_style']
        if style not in ['gentle', 'moderate', 'aggressive']:
            return jsonify({'error': 'intervention_style must be gentle, moderate, or aggressive'}), 400
        settings.intervention_style = style
    
    # Update timestamp
    settings.updated_at = datetime.utcnow()
    
    # Increment settings version for sync
    user.settings_version += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Settings updated successfully',
        'settings': {
            'dark_pattern_sensitivity': settings.dark_pattern_sensitivity,
            'doomscroll_time_threshold': settings.doomscroll_time_threshold,
            'enabled_websites': settings.get_enabled_websites(),
            'intervention_style': settings.intervention_style,
            'updated_at': settings.updated_at.isoformat()
        },
        'settings_version': user.settings_version
    }), 200
