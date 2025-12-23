from hypothesis import given, strategies as st
from backend.utils.crypto import encrypt_data, decrypt_data
from backend.utils.validators import sanitize_string, validate_username, validate_url

@given(
    data=st.one_of(
        st.binary(min_size=1, max_size=1000),
        st.text(min_size=1, max_size=1000)
    )
)
def test_sensitive_data_encryption(data):
    encrypted = encrypt_data(data)
    
    assert encrypted != data
    
    if isinstance(data, str):
        assert encrypted != data.encode()
    
    decrypted = decrypt_data(encrypted)
    
    if isinstance(data, str):
        assert decrypted.decode() == data
    else:
        assert decrypted == data

@given(
    username=st.text(min_size=1, max_size=100),
    url=st.text(min_size=1, max_size=2048)
)
def test_input_sanitization(username, url):
    sanitized_username = sanitize_string(username)
    
    assert '<' not in sanitized_username
    assert '>' not in sanitized_username
    
    sanitized_url = sanitize_string(url)
    
    assert '<' not in sanitized_url
    assert '>' not in sanitized_url
    
    if username.strip():
        valid, error = validate_username(sanitized_username)
        if valid:
            assert error is None
        else:
            assert error is not None
