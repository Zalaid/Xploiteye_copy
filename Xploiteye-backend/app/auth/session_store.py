"""
Temporary session store for OAuth token exchange
In production, this should use Redis or similar persistent storage
"""

import time
from typing import Dict, Optional

# In-memory store (for development only)
_token_store: Dict[str, Dict] = {}

def store_temp_token(session_token: str, jwt_token: str, expires_in: int = 300) -> None:
    """Store JWT token temporarily with session token (5 min expiry)"""
    expiry_time = time.time() + expires_in
    _token_store[session_token] = {
        'jwt_token': jwt_token,
        'expires_at': expiry_time
    }
    
    # Clean up expired tokens
    cleanup_expired_tokens()

def get_temp_token(session_token: str) -> Optional[str]:
    """Retrieve and remove JWT token using session token"""
    cleanup_expired_tokens()
    
    if session_token in _token_store:
        token_data = _token_store.pop(session_token)  # Remove after use
        if token_data['expires_at'] > time.time():
            return token_data['jwt_token']
    
    return None

def cleanup_expired_tokens():
    """Remove expired tokens from store"""
    current_time = time.time()
    expired_tokens = [
        token for token, data in _token_store.items() 
        if data['expires_at'] <= current_time
    ]
    
    for token in expired_tokens:
        del _token_store[token]