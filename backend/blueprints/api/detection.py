from flask import request, jsonify
from backend.blueprints.api import api_bp
from backend.services.auth_service import AuthService
from backend.models import db, DetectionLog, DoomscrollLog
from datetime import datetime
import json

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

@api_bp.route('/detection/log', methods=['POST'])
@require_auth
def log_detection(user):
    """Log a dark pattern detection event"""
    data = request.get_json()
    
    # Validate required fields
    url = data.get('url')
    pattern_type = data.get('pattern_type')
    confidence_score = data.get('confidence_score')
    
    if not url or not pattern_type or confidence_score is None:
        return jsonify({'error': 'Missing required fields: url, pattern_type, confidence_score'}), 400
    
    # Validate confidence score
    if not isinstance(confidence_score, (int, float)) or confidence_score < 0 or confidence_score > 1:
        return jsonify({'error': 'Confidence score must be between 0 and 1'}), 400
    
    # Create detection log
    detection = DetectionLog(
        user_id=user.id,
        url=url[:2048],  # Limit URL length
        pattern_type=pattern_type[:100],
        confidence_score=float(confidence_score),
        detected_at=datetime.utcnow()
    )
    
    # Add page elements if provided
    page_elements = data.get('page_elements')
    if page_elements:
        detection.set_page_elements(page_elements)
    
    db.session.add(detection)
    db.session.commit()
    
    return jsonify({
        'message': 'Detection logged successfully',
        'id': detection.id,
        'detected_at': detection.detected_at.isoformat()
    }), 201

@api_bp.route('/detection/doomscroll', methods=['POST'])
@require_auth
def log_doomscroll(user):
    """Log a doomscrolling intervention event"""
    data = request.get_json()
    
    # Validate required fields
    url = data.get('url')
    scroll_duration = data.get('scroll_duration')
    
    if not url or scroll_duration is None:
        return jsonify({'error': 'Missing required fields: url, scroll_duration'}), 400
    
    # Validate scroll duration
    if not isinstance(scroll_duration, int) or scroll_duration < 0:
        return jsonify({'error': 'Scroll duration must be a positive integer (seconds)'}), 400
    
    # Create doomscroll log
    doomscroll = DoomscrollLog(
        user_id=user.id,
        url=url[:2048],
        scroll_duration=scroll_duration,
        intervention_triggered=data.get('intervention_triggered', False),
        user_response=data.get('user_response', '')[:20],
        logged_at=datetime.utcnow()
    )
    
    db.session.add(doomscroll)
    db.session.commit()
    
    return jsonify({
        'message': 'Doomscroll event logged successfully',
        'id': doomscroll.id,
        'logged_at': doomscroll.logged_at.isoformat()
    }), 201

@api_bp.route('/detection/recent', methods=['GET'])
@require_auth
def get_recent_detections(user):
    """Get recent detection events for the authenticated user"""
    # Get query parameters
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    pattern_type = request.args.get('pattern_type')
    
    # Limit the maximum results
    limit = min(limit, 100)
    
    # Build query
    query = DetectionLog.query.filter_by(user_id=user.id)
    
    if pattern_type:
        query = query.filter_by(pattern_type=pattern_type)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    detections = query.order_by(DetectionLog.detected_at.desc()).offset(offset).limit(limit).all()
    
    return jsonify({
        'detections': [{
            'id': d.id,
            'url': d.url,
            'pattern_type': d.pattern_type,
            'confidence_score': d.confidence_score,
            'detected_at': d.detected_at.isoformat(),
            'page_elements': d.get_page_elements()
        } for d in detections],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200

@api_bp.route('/detection/doomscroll/recent', methods=['GET'])
@require_auth
def get_recent_doomscrolls(user):
    """Get recent doomscroll events for the authenticated user"""
    # Get query parameters
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    # Limit the maximum results
    limit = min(limit, 100)
    
    # Build query
    query = DoomscrollLog.query.filter_by(user_id=user.id)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    doomscrolls = query.order_by(DoomscrollLog.logged_at.desc()).offset(offset).limit(limit).all()
    
    return jsonify({
        'doomscrolls': [{
            'id': d.id,
            'url': d.url,
            'scroll_duration': d.scroll_duration,
            'intervention_triggered': d.intervention_triggered,
            'user_response': d.user_response,
            'logged_at': d.logged_at.isoformat()
        } for d in doomscrolls],
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200
