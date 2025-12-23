from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os

def get_encryption_key():
    password = os.environ.get('ENCRYPTION_KEY', 'dev-encryption-key-32-bytes-long').encode()
    salt = b'shieldui_salt_v1'
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(password))
    return key

_fernet = None

def get_fernet():
    global _fernet
    if _fernet is None:
        _fernet = Fernet(get_encryption_key())
    return _fernet

def encrypt_data(data):
    if isinstance(data, str):
        data = data.encode()
    
    fernet = get_fernet()
    encrypted = fernet.encrypt(data)
    return encrypted

def decrypt_data(encrypted_data):
    if isinstance(encrypted_data, str):
        encrypted_data = encrypted_data.encode('latin-1')
    
    fernet = get_fernet()
    decrypted = fernet.decrypt(encrypted_data)
    return decrypted
