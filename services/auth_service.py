import secrets
import hashlib
from datetime import datetime, timedelta
from backend.models import User, Session, db
from backend.utils.crypto import encrypt_data, decrypt_data
import pyotp
import qrcode
import io
import base64

class AuthService:
    @staticmethod
    def register_passkey(username, passkey_credential_data):
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return None, 'Username already exists'
        
        encrypted_credential = encrypt_data(passkey_credential_data)
        
        user = User(
            username=username,
            passkey_credential=encrypted_credential,
            totp_secret=''
        )
        
        return user, None
    
    @staticmethod
    def setup_totp(user):
        totp_secret = pyotp.random_base32()
        encrypted_secret = encrypt_data(totp_secret.encode())
        
        user.totp_secret = encrypted_secret.decode('latin-1')
        
        totp_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
            name=user.username,
            issuer_name='ShieldUI'
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color='black', back_color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return totp_secret, qr_code_base64
    
    @staticmethod
    def verify_passkey(username, passkey_credential_data):
        user = User.query.filter_by(username=username).first()
        if not user:
            return None, 'User not found'
        
        try:
            stored_credential = decrypt_data(user.passkey_credential)
            if stored_credential == passkey_credential_data:
                return user, None
            else:
                return None, 'Invalid passkey'
        except Exception as e:
            return None, 'Passkey verification failed'
    
    @staticmethod
    def verify_totp(user, totp_code):
        try:
            encrypted_secret = user.totp_secret.encode('latin-1')
            totp_secret = decrypt_data(encrypted_secret).decode()
            
            totp = pyotp.TOTP(totp_secret)
            
            if totp.verify(totp_code, valid_window=1):
                return True
            return False
        except Exception as e:
            return False
    
    @staticmethod
    def create_session(user):
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        session = Session(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        
        db.session.add(session)
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        return token, expires_at
    
    @staticmethod
    def validate_session(token):
        session = Session.query.filter_by(token=token).first()
        
        if not session:
            return None, 'Invalid session'
        
        if session.expires_at < datetime.utcnow():
            db.session.delete(session)
            db.session.commit()
            return None, 'Session expired'
        
        return session.user, None
    
    @staticmethod
    def invalidate_session(token):
        session = Session.query.filter_by(token=token).first()
        if session:
            db.session.delete(session)
            db.session.commit()
            return True
        return False
