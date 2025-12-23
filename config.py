import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///shieldui.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY') or 'dev-encryption-key-32-bytes-long'
    GEMINI_API_URL = os.environ.get('GEMINI_API_URL') or 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or 'AIzaSyCxgVkDqi8hU_XMKwJ1HPY1GEIpI7l0SfQ'
    OCR_TIMEOUT = 15
    AI_TIMEOUT = 15
    RATE_LIMIT_AUTH = '5 per minute'
    RATE_LIMIT_DETECTION = '100 per minute'
    RATE_LIMIT_ANALYTICS = '20 per minute'
