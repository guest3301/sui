import json

def test_register_passkey(client):
    response = client.post('/api/auth/register/passkey', 
        json={'username': 'testuser', 'passkey_credential': 'test_credential'})
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['username'] == 'testuser'
    assert 'user_id' in data

def test_register_passkey_duplicate(client):
    client.post('/api/auth/register/passkey', 
        json={'username': 'testuser', 'passkey_credential': 'test_credential'})
    
    response = client.post('/api/auth/register/passkey', 
        json={'username': 'testuser', 'passkey_credential': 'test_credential2'})
    
    assert response.status_code == 409

def test_login_invalid_passkey(client):
    client.post('/api/auth/register/passkey', 
        json={'username': 'testuser', 'passkey_credential': 'correct_credential'})
    
    response = client.post('/api/auth/login', 
        json={'username': 'testuser', 'passkey_credential': 'wrong_credential', 'totp_code': '123456'})
    
    assert response.status_code == 401

def test_session_validation(client):
    response = client.get('/api/auth/session', 
        headers={'Authorization': 'Bearer invalid_token'})
    
    assert response.status_code == 401
