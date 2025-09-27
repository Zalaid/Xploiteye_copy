"""
MFA utilities for TOTP authentication
"""

import pyotp
import qrcode
import io
import base64
import secrets
from typing import List, Optional


class MFAUtils:
    """Utility class for MFA/TOTP operations"""
    
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(email: str, secret: str, issuer: str = "XploitEye") -> str:
        """
        Generate QR code for TOTP setup
        Returns base64 encoded PNG image
        """
        # Create TOTP URI
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name=issuer
        )
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Create image
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        qr_image.save(buffer, format='PNG')
        buffer.seek(0)
        
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{qr_base64}"
    
    @staticmethod
    def generate_backup_url(email: str, secret: str, issuer: str = "XploitEye") -> str:
        """Generate manual entry backup URL"""
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name=issuer
        )
    
    @staticmethod
    def verify_totp_code(secret: str, code: str, window: int = 2) -> bool:
        """
        Verify TOTP code
        window: number of 30-second windows to check (for clock drift)
        """
        if not secret or not code:
            print(f"❌ MFA Debug: Empty secret or code - secret: {bool(secret)}, code: {bool(code)}")
            return False

        # Strip any whitespace and ensure it's exactly 6 digits
        cleaned_code = str(code).strip().replace(' ', '')
        if len(cleaned_code) != 6 or not cleaned_code.isdigit():
            print(f"❌ MFA Debug: Invalid code format - received: '{code}' -> cleaned: '{cleaned_code}' (length: {len(cleaned_code)})")
            return False

        totp = pyotp.TOTP(secret)

        # Debug logging
        current_code = totp.now()
        print(f"🔍 MFA Debug: Verifying code '{cleaned_code}' against secret")
        print(f"🔍 MFA Debug: Current expected code: '{current_code}'")
        print(f"🔍 MFA Debug: Window: {window} (±{window*30} seconds)")

        result = totp.verify(cleaned_code, valid_window=window)
        print(f"{'✅' if result else '❌'} MFA Debug: Verification result: {result}")

        return result
    
    @staticmethod
    def generate_recovery_codes(count: int = 10) -> List[str]:
        """Generate recovery codes for backup authentication"""
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric codes
            code = secrets.token_hex(4).upper()
            # Format as XXXX-XXXX for readability
            formatted_code = f"{code[:4]}-{code[4:]}"
            codes.append(formatted_code)
        return codes
    
    @staticmethod
    def verify_recovery_code(stored_codes: List[str], provided_code: str) -> bool:
        """
        Verify a recovery code
        Returns True if valid, False if invalid or already used
        """
        if not stored_codes or not provided_code:
            return False
            
        # Normalize the provided code (remove spaces, convert to uppercase)
        normalized_code = provided_code.replace(" ", "").replace("-", "").upper()
        
        # Check against stored codes (also normalize them)
        for stored_code in stored_codes:
            if stored_code and stored_code.replace("-", "").upper() == normalized_code:
                return True
        
        return False
    
    @staticmethod
    def use_recovery_code(stored_codes: List[str], provided_code: str) -> tuple[bool, List[str]]:
        """
        Use a recovery code (mark as used and return updated list)
        Returns (success, updated_codes_list)
        """
        if not stored_codes or not provided_code:
            return False, stored_codes
            
        # Normalize the provided code
        normalized_code = provided_code.replace(" ", "").replace("-", "").upper()
        
        updated_codes = []
        used = False
        
        for stored_code in stored_codes:
            if stored_code and stored_code.replace("-", "").upper() == normalized_code and not used:
                # Mark this code as used (set to None or empty string)
                updated_codes.append(None)
                used = True
            else:
                updated_codes.append(stored_code)
        
        return used, updated_codes


# Create global instance
mfa_utils = MFAUtils()