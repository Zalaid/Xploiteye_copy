"""
Google OAuth integration for XploitEye Backend
"""

import httpx
from typing import Optional, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow

from config.settings import settings

class GoogleOAuthService:
    """Google OAuth service for handling authentication"""
    
    def __init__(self):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri
        
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """Get Google OAuth authorization URL"""
        try:
            # Create flow instance
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=[
                    'openid',
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile'
                ]
            )
            flow.redirect_uri = self.redirect_uri

            # Build authorization URL with optional state
            auth_params = {
                'access_type': 'offline',
                'include_granted_scopes': 'true'
            }
            if state:
                auth_params['state'] = state

            authorization_url, _ = flow.authorization_url(**auth_params)

            return authorization_url

        except Exception as e:
            raise Exception(f"Failed to generate authorization URL: {str(e)}")
    
    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        try:
            # Configure client with better timeout and connectivity settings
            timeout_config = httpx.Timeout(
                connect=30.0,
                read=30.0,
                write=30.0,
                pool=30.0
            )
            
            transport = httpx.AsyncHTTPTransport(
                verify=False,
                retries=3
            )
            
            async with httpx.AsyncClient(timeout=timeout_config, transport=transport) as client:
                token_data = {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': self.redirect_uri
                }
                
                response = await client.post(
                    'https://oauth2.googleapis.com/token',
                    data=token_data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                
                if response.status_code == 200:
                    tokens = response.json()
                    return {
                        'access_token': tokens.get('access_token'),
                        'refresh_token': tokens.get('refresh_token'),
                        'id_token': tokens.get('id_token'),
                        'expires_in': tokens.get('expires_in')
                    }
                else:
                    error_response = response.text
                    raise Exception(f"HTTP token exchange failed: {response.status_code} - {error_response}")
            
        except Exception as e:
            raise Exception(f"Failed to exchange code for tokens: {str(e)}")
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information using access token (more reliable than ID token verification)"""
        import asyncio
        
        for attempt in range(3):  # Retry up to 3 times
            try:
                # Use same connectivity settings as token exchange
                timeout_config = httpx.Timeout(30.0)
                transport = httpx.AsyncHTTPTransport(verify=False, retries=2)
                
                async with httpx.AsyncClient(timeout=timeout_config, transport=transport) as client:
                    # Use Google's userinfo endpoint
                    response = await client.get(
                        'https://www.googleapis.com/oauth2/v2/userinfo',
                        headers={'Authorization': f'Bearer {access_token}'}
                    )
                    
                    if response.status_code == 200:
                        user_data = response.json()
                        return {
                            'google_id': user_data.get('id'),
                            'email': user_data.get('email'),
                            'name': user_data.get('name'),
                            'picture': user_data.get('picture'),
                            'email_verified': user_data.get('verified_email', False)
                        }
                    else:
                        error_msg = f"Google API returned status {response.status_code}: {response.text}"
                        raise Exception(error_msg)
                        
            except Exception as e:
                if attempt == 2:  # Last attempt
                    raise Exception(f"Failed to get user info after 3 attempts: {str(e)}")
                else:
                    await asyncio.sleep(1)  # Wait 1 second before retry
    
    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Get detailed user profile from Google People API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise Exception(f"Failed to fetch user profile: {response.status_code}")
                    
        except Exception as e:
            raise Exception(f"Failed to get user profile: {str(e)}")