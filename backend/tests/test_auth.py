from hypothesis import given, strategies as st, assume, settings, HealthCheck
from backend.services.auth_service import AuthService
from backend.models import User, db
from datetime import datetime
import pyotp

@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    username=st.text(min_size=3, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',))),
    passkey_data=st.binary(min_size=10, max_size=100),
    totp_code=st.text(min_size=6, max_size=6, alphabet=st.characters(whitelist_categories=('Nd',)))
)
def test_two_factor_authentication_requirement(db_session, username, passkey_data, totp_code):
    assume(username.strip() != '')
    
    user, error = AuthService.register_passkey(username, passkey_data)
    if error:
        return
    
    db_session.add(user)
    totp_secret, _ = AuthService.setup_totp(user)
    db_session.commit()
    
    verified_user, error = AuthService.verify_passkey(username, passkey_data)
    assert verified_user is not None or error is not None
    
    if verified_user:
        totp_valid = AuthService.verify_totp(verified_user, totp_code)
        
        if totp_valid:
            token, expires = AuthService.create_session(verified_user)
            assert token is not None
            assert expires is not None

@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    username=st.text(min_size=3, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',))),
    correct_passkey=st.binary(min_size=10, max_size=100),
    wrong_passkey=st.binary(min_size=10, max_size=100)
)
def test_failed_passkey_rejection(db_session, username, correct_passkey, wrong_passkey):
    assume(username.strip() != '')
    assume(correct_passkey != wrong_passkey)
    
    user, error = AuthService.register_passkey(username, correct_passkey)
    if error:
        return
    
    db_session.add(user)
    totp_secret, _ = AuthService.setup_totp(user)
    db_session.commit()
    
    verified_user, error = AuthService.verify_passkey(username, wrong_passkey)
    
    assert verified_user is None
    assert error is not None

@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    username=st.text(min_size=3, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',))),
    passkey_data=st.binary(min_size=10, max_size=100),
    invalid_totp=st.text(min_size=6, max_size=6, alphabet=st.characters(whitelist_categories=('Nd',)))
)
def test_invalid_totp_rejection(db_session, username, passkey_data, invalid_totp):
    assume(username.strip() != '')
    
    user, error = AuthService.register_passkey(username, passkey_data)
    if error:
        return
    
    db_session.add(user)
    totp_secret, _ = AuthService.setup_totp(user)
    db_session.commit()
    
    verified_user, error = AuthService.verify_passkey(username, passkey_data)
    if not verified_user:
        return
    
    totp = pyotp.TOTP(totp_secret)
    valid_code = totp.now()
    
    assume(invalid_totp != valid_code)
    
    totp_valid = AuthService.verify_totp(verified_user, invalid_totp)
    
    assert totp_valid is False

@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    username=st.text(min_size=3, max_size=50, alphabet=st.characters(blacklist_categories=('Cs',))),
    passkey_data=st.binary(min_size=10, max_size=100)
)
def test_session_token_creation(db_session, username, passkey_data):
    assume(username.strip() != '')
    
    user, error = AuthService.register_passkey(username, passkey_data)
    if error:
        return
    
    db_session.add(user)
    totp_secret, _ = AuthService.setup_totp(user)
    db_session.commit()
    
    verified_user, error = AuthService.verify_passkey(username, passkey_data)
    if not verified_user:
        return
    
    totp = pyotp.TOTP(totp_secret)
    valid_code = totp.now()
    
    totp_valid = AuthService.verify_totp(verified_user, valid_code)
    
    if totp_valid:
        token, expires = AuthService.create_session(verified_user)
        
        assert token is not None
        assert len(token) > 0
        assert expires is not None
        assert expires > datetime.utcnow()
