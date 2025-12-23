from flask import request, jsonify
from backend.blueprints.api import api_bp
from backend.services.auth_service import AuthService
from backend.models import db, DetectionLog, DoomscrollLog
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from urllib.parse import urlparse

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

@api_bp.route('/analytics/summary', methods=['GET'])
@require_auth
def get_analytics_summary(user):
    """Get summary analytics for the authenticated user"""
    # Get date range from query params (default to last 30 days)
    days = request.args.get('days', 30, type=int)
    days = min(days, 365)  # Max 1 year
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Detection stats
    total_detections = DetectionLog.query.filter(
        DetectionLog.user_id == user.id,
        DetectionLog.detected_at >= start_date
    ).count()
    
    avg_confidence = db.session.query(func.avg(DetectionLog.confidence_score)).filter(
        DetectionLog.user_id == user.id,
        DetectionLog.detected_at >= start_date
    ).scalar() or 0
    
    # Doomscroll stats
    total_doomscrolls = DoomscrollLog.query.filter(
        DoomscrollLog.user_id == user.id,
        DoomscrollLog.logged_at >= start_date
    ).count()
    
    total_scroll_time = db.session.query(func.sum(DoomscrollLog.scroll_duration)).filter(
        DoomscrollLog.user_id == user.id,
        DoomscrollLog.logged_at >= start_date
    ).scalar() or 0
    
    interventions_triggered = DoomscrollLog.query.filter(
        DoomscrollLog.user_id == user.id,
        DoomscrollLog.logged_at >= start_date,
        DoomscrollLog.intervention_triggered == True
    ).count()
    
    return jsonify({
        'period_days': days,
        'detections': {
            'total': total_detections,
            'avg_confidence': round(float(avg_confidence), 3)
        },
        'doomscrolls': {
            'total': total_doomscrolls,
            'total_time_seconds': int(total_scroll_time),
            'interventions_triggered': interventions_triggered,
            'intervention_rate': round(interventions_triggered / max(total_doomscrolls, 1), 3)
        }
    }), 200

@api_bp.route('/analytics/patterns', methods=['GET'])
@require_auth
def get_pattern_breakdown(user):
    """Get breakdown of detected pattern types"""
    days = request.args.get('days', 30, type=int)
    days = min(days, 365)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Group by pattern type
    pattern_stats = db.session.query(
        DetectionLog.pattern_type,
        func.count(DetectionLog.id).label('count'),
        func.avg(DetectionLog.confidence_score).label('avg_confidence')
    ).filter(
        DetectionLog.user_id == user.id,
        DetectionLog.detected_at >= start_date
    ).group_by(DetectionLog.pattern_type).order_by(desc('count')).all()
    
    return jsonify({
        'patterns': [{
            'type': p.pattern_type,
            'count': p.count,
            'avg_confidence': round(float(p.avg_confidence), 3)
        } for p in pattern_stats]
    }), 200

@api_bp.route('/analytics/websites', methods=['GET'])
@require_auth
def get_problematic_websites(user):
    """Get most problematic websites"""
    days = request.args.get('days', 30, type=int)
    days = min(days, 365)
    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 50)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get detection counts by URL
    detection_stats = db.session.query(
        DetectionLog.url,
        func.count(DetectionLog.id).label('detection_count')
    ).filter(
        DetectionLog.user_id == user.id,
        DetectionLog.detected_at >= start_date
    ).group_by(DetectionLog.url).subquery()
    
    # Get doomscroll stats by URL
    doomscroll_stats = db.session.query(
        DoomscrollLog.url,
        func.count(DoomscrollLog.id).label('doomscroll_count'),
        func.sum(DoomscrollLog.scroll_duration).label('total_time')
    ).filter(
        DoomscrollLog.user_id == user.id,
        DoomscrollLog.logged_at >= start_date
    ).group_by(DoomscrollLog.url).subquery()
    
    # Join and aggregate
    combined = db.session.query(
        func.coalesce(detection_stats.c.url, doomscroll_stats.c.url).label('url'),
        func.coalesce(detection_stats.c.detection_count, 0).label('detections'),
        func.coalesce(doomscroll_stats.c.doomscroll_count, 0).label('doomscrolls'),
        func.coalesce(doomscroll_stats.c.total_time, 0).label('total_time')
    ).outerjoin(
        doomscroll_stats, detection_stats.c.url == doomscroll_stats.c.url
    ).order_by(
        desc('detections'), desc('doomscrolls')
    ).limit(limit).all()
    
    websites = []
    for row in combined:
        try:
            parsed = urlparse(row.url)
            domain = parsed.netloc or parsed.path
        except:
            domain = row.url
        
        websites.append({
            'url': row.url,
            'domain': domain,
            'detections': row.detections,
            'doomscrolls': row.doomscrolls,
            'total_time_seconds': int(row.total_time)
        })
    
    return jsonify({'websites': websites}), 200

@api_bp.route('/analytics/timeline', methods=['GET'])
@require_auth
def get_timeline(user):
    """Get timeline data for charts"""
    days = request.args.get('days', 30, type=int)
    days = min(days, 365)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get daily detection counts
    daily_detections = db.session.query(
        func.date(DetectionLog.detected_at).label('date'),
        func.count(DetectionLog.id).label('count')
    ).filter(
        DetectionLog.user_id == user.id,
        DetectionLog.detected_at >= start_date
    ).group_by(func.date(DetectionLog.detected_at)).all()
    
    # Get daily doomscroll counts and time
    daily_doomscrolls = db.session.query(
        func.date(DoomscrollLog.logged_at).label('date'),
        func.count(DoomscrollLog.id).label('count'),
        func.sum(DoomscrollLog.scroll_duration).label('total_time')
    ).filter(
        DoomscrollLog.user_id == user.id,
        DoomscrollLog.logged_at >= start_date
    ).group_by(func.date(DoomscrollLog.logged_at)).all()
    
    # Combine into timeline
    timeline = {}
    
    for row in daily_detections:
        date_str = row.date.isoformat()
        if date_str not in timeline:
            timeline[date_str] = {'date': date_str, 'detections': 0, 'doomscrolls': 0, 'scroll_time': 0}
        timeline[date_str]['detections'] = row.count
    
    for row in daily_doomscrolls:
        date_str = row.date.isoformat()
        if date_str not in timeline:
            timeline[date_str] = {'date': date_str, 'detections': 0, 'doomscrolls': 0, 'scroll_time': 0}
        timeline[date_str]['doomscrolls'] = row.count
        timeline[date_str]['scroll_time'] = int(row.total_time)
    
    # Sort by date
    sorted_timeline = sorted(timeline.values(), key=lambda x: x['date'])
    
    return jsonify({'timeline': sorted_timeline}), 200
