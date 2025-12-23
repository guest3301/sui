from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    passkey_credential = db.Column(db.LargeBinary, nullable=False)
    totp_secret = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    settings_version = db.Column(db.Integer, default=0)
    
    settings = db.relationship('Settings', backref='user', uselist=False, cascade='all, delete-orphan')
    detection_logs = db.relationship('DetectionLog', backref='user', cascade='all, delete-orphan')
    doomscroll_logs = db.relationship('DoomscrollLog', backref='user', cascade='all, delete-orphan')
    sessions = db.relationship('Session', backref='user', cascade='all, delete-orphan')

class Settings(db.Model):
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    dark_pattern_sensitivity = db.Column(db.Float, default=0.7)
    doomscroll_time_threshold = db.Column(db.Integer, default=300)
    enabled_websites = db.Column(db.Text, default='[]')
    intervention_style = db.Column(db.String(20), default='moderate')
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_enabled_websites(self):
        return json.loads(self.enabled_websites)
    
    def set_enabled_websites(self, websites):
        self.enabled_websites = json.dumps(websites)

class DetectionLog(db.Model):
    __tablename__ = 'detection_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    url = db.Column(db.String(2048), nullable=False, index=True)
    pattern_type = db.Column(db.String(100), nullable=False, index=True)
    confidence_score = db.Column(db.Float, nullable=False)
    detected_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    page_elements = db.Column(db.Text)
    
    def get_page_elements(self):
        return json.loads(self.page_elements) if self.page_elements else []
    
    def set_page_elements(self, elements):
        self.page_elements = json.dumps(elements)

class DoomscrollLog(db.Model):
    __tablename__ = 'doomscroll_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    url = db.Column(db.String(2048), nullable=False, index=True)
    scroll_duration = db.Column(db.Integer, nullable=False)
    intervention_triggered = db.Column(db.Boolean, default=False)
    user_response = db.Column(db.String(20))
    logged_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
