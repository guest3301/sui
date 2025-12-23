import re
from urllib.parse import urlparse

def validate_username(username):
    if not username or not isinstance(username, str):
        return False, 'Username must be a non-empty string'
    
    if len(username) < 3 or len(username) > 50:
        return False, 'Username must be between 3 and 50 characters'
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, 'Username can only contain letters, numbers, underscores, and hyphens'
    
    return True, None

def validate_url(url):
    if not url or not isinstance(url, str):
        return False, 'URL must be a non-empty string'
    
    if len(url) > 2048:
        return False, 'URL is too long'
    
    try:
        result = urlparse(url)
        if not all([result.scheme, result.netloc]):
            return False, 'Invalid URL format'
        return True, None
    except Exception:
        return False, 'Invalid URL format'

def validate_sensitivity(sensitivity):
    if not isinstance(sensitivity, (int, float)):
        return False, 'Sensitivity must be a number'
    
    if sensitivity < 0.0 or sensitivity > 1.0:
        return False, 'Sensitivity must be between 0.0 and 1.0'
    
    return True, None

def validate_time_threshold(threshold):
    if not isinstance(threshold, int):
        return False, 'Time threshold must be an integer'
    
    if threshold < 1 or threshold > 7200:
        return False, 'Time threshold must be between 1 and 7200 seconds'
    
    return True, None

def validate_intervention_style(style):
    valid_styles = ['gentle', 'moderate', 'strict']
    
    if not isinstance(style, str):
        return False, 'Intervention style must be a string'
    
    if style not in valid_styles:
        return False, f'Intervention style must be one of: {", ".join(valid_styles)}'
    
    return True, None

def sanitize_string(value):
    if not isinstance(value, str):
        return str(value)
    
    sanitized = value.strip()
    
    sanitized = re.sub(r'[<>]', '', sanitized)
    
    return sanitized

def validate_pattern_type(pattern_type):
    valid_types = [
        'urgency_manipulation',
        'misdirection',
        'social_proof_manipulation',
        'obstruction',
        'other'
    ]
    
    if not isinstance(pattern_type, str):
        return False, 'Pattern type must be a string'
    
    if pattern_type not in valid_types:
        return False, f'Pattern type must be one of: {", ".join(valid_types)}'
    
    return True, None

def validate_confidence_score(score):
    if not isinstance(score, (int, float)):
        return False, 'Confidence score must be a number'
    
    if score < 0.0 or score > 1.0:
        return False, 'Confidence score must be between 0.0 and 1.0'
    
    return True, None

def validate_user_response(response):
    valid_responses = ['continued', 'break', 'closed']
    
    if not isinstance(response, str):
        return False, 'User response must be a string'
    
    if response not in valid_responses:
        return False, f'User response must be one of: {", ".join(valid_responses)}'
    
    return True, None
