from flask import request, jsonify
from backend.blueprints.api import api_bp
from backend.models import db, DetectionLog, DoomscrollLog, Settings
from datetime import datetime, timedelta
import json

@api_bp.route('/user/stats', methods=['GET'])
def get_user_stats():
    """Get user statistics"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Get date range from query params (default to last 7 days)
    days = request.args.get('days', 7, type=int)
    days = min(days, 365)  # Max 1 year
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Detection stats
    total_detections = DetectionLog.query.filter(
        DetectionLog.user_id == user_id,
        DetectionLog.detected_at >= start_date
    ).count()
    
    # Doomscroll stats
    total_doomscrolls = DoomscrollLog.query.filter(
        DoomscrollLog.user_id == user_id,
        DoomscrollLog.logged_at >= start_date
    ).count()
    
    total_scroll_time = db.session.query(db.func.sum(DoomscrollLog.scroll_duration)).filter(
        DoomscrollLog.user_id == user_id,
        DoomscrollLog.logged_at >= start_date
    ).scalar() or 0
    
    interventions_triggered = DoomscrollLog.query.filter(
        DoomscrollLog.user_id == user_id,
        DoomscrollLog.logged_at >= start_date,
        DoomscrollLog.intervention_triggered == True
    ).count()
    
    # Recent detections
    recent_detections = DetectionLog.query.filter(
        DetectionLog.user_id == user_id
    ).order_by(DetectionLog.detected_at.desc()).limit(5).all()
    
    return jsonify({
        'user_id': user_id,
        'period_days': days,
        'stats': {
            'total_detections': total_detections,
            'total_doomscrolls': total_doomscrolls,
            'total_scroll_time_seconds': int(total_scroll_time),
            'interventions_triggered': interventions_triggered
        },
        'recent_detections': [{
            'id': d.id,
            'url': d.url,
            'pattern_type': d.pattern_type,
            'confidence_score': d.confidence_score,
            'detected_at': d.detected_at.isoformat()
        } for d in recent_detections]
    }), 200

@api_bp.route('/user/export', methods=['GET'])
def export_user_data():
    """Export all user data"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Get date range
    days = request.args.get('days', type=int)
    if days:
        start_date = datetime.utcnow() - timedelta(days=days)
        detection_filter = DetectionLog.query.filter(
            DetectionLog.user_id == user_id,
            DetectionLog.detected_at >= start_date
        )
        doomscroll_filter = DoomscrollLog.query.filter(
            DoomscrollLog.user_id == user_id,
            DoomscrollLog.logged_at >= start_date
        )
    else:
        detection_filter = DetectionLog.query.filter(DetectionLog.user_id == user_id)
        doomscroll_filter = DoomscrollLog.query.filter(DoomscrollLog.user_id == user_id)
    
    # Get all detections
    detections = detection_filter.order_by(DetectionLog.detected_at.desc()).all()
    
    # Get all doomscroll logs
    doomscrolls = doomscroll_filter.order_by(DoomscrollLog.logged_at.desc()).all()
    
    # Get user settings
    settings = Settings.query.filter_by(user_id=user_id).first()
    
    export_data = {
        'user_id': user_id,
        'exported_at': datetime.utcnow().isoformat(),
        'settings': {
            'dark_pattern_sensitivity': settings.dark_pattern_sensitivity if settings else 0.7,
            'doomscroll_time_threshold': settings.doomscroll_time_threshold if settings else 300,
            'intervention_style': settings.intervention_style if settings else 'moderate',
            'enabled_websites': settings.get_enabled_websites() if settings else []
        } if settings else None,
        'detections': [{
            'id': d.id,
            'url': d.url,
            'pattern_type': d.pattern_type,
            'confidence_score': d.confidence_score,
            'detected_at': d.detected_at.isoformat(),
            'page_elements': d.get_page_elements()
        } for d in detections],
        'doomscrolls': [{
            'id': d.id,
            'url': d.url,
            'scroll_duration': d.scroll_duration,
            'intervention_triggered': d.intervention_triggered,
            'user_response': d.user_response,
            'logged_at': d.logged_at.isoformat()
        } for d in doomscrolls],
        'summary': {
            'total_detections': len(detections),
            'total_doomscrolls': len(doomscrolls),
            'total_scroll_time_seconds': sum(d.scroll_duration for d in doomscrolls)
        }
    }
    
    return jsonify(export_data), 200
