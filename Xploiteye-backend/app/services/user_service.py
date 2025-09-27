"""
User service for database operations
"""

from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

from app.models.user import UserCreate, UserInDB, UserResponse
from app.database.mongodb import get_database
from app.auth.security import SecurityUtils

class UserService:
    """Service class for user-related operations"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = self.db.users
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        try:
            # Check if email already exists
            existing_email = await self.collection.find_one({"email": user_data.email})
            if existing_email:
                raise ValueError("User with this email already exists")
            
            # Check if username already exists (case-insensitive)
            existing_username = await self.collection.find_one({"username": {"$regex": f"^{user_data.username}$", "$options": "i"}})
            if existing_username:
                raise ValueError("Username is already taken")
            
            # Determine user role based on username/email
            role = self._determine_user_role(user_data.username, user_data.email)
            
            # Hash the password
            hashed_password = SecurityUtils.hash_password(user_data.password)
            
            # Create user document
            user_doc = UserInDB(
                email=user_data.email,
                username=user_data.username,
                name=user_data.name,
                display_name=user_data.display_name,
                hashed_password=hashed_password,
                role=role,
                active_jwt_identifier=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Insert into database
            result = await self.collection.insert_one(user_doc.dict(by_alias=True, exclude={"id"}))
            
            # Fetch the created user
            created_user = await self.collection.find_one({"_id": result.inserted_id})
            
            return UserResponse(
                id=str(created_user["_id"]),
                email=created_user["email"],
                username=created_user["username"],
                name=created_user["name"],
                display_name=created_user["display_name"],
                role=created_user["role"],
                created_at=created_user["created_at"]
            )
            
        except ValueError as e:
            raise e  # Re-raise validation errors as-is
        except DuplicateKeyError:
            raise ValueError("User with this email or username already exists")
        except Exception as e:
            raise Exception(f"Failed to create user: {str(e)}")
    
    def _determine_user_role(self, username: str, email: str) -> str:
        """Determine user role based on username/email"""
        username_lower = username.lower()
        email_lower = email.lower()
        
        # Admin role
        if 'admin' in username_lower or 'admin' in email_lower:
            return 'admin'
        
        # Analyst role 
        if any(word in username_lower for word in ['analyst', 'security', 'red', 'blue', 'pen', 'test']):
            return 'analyst'
        if any(word in email_lower for word in ['analyst', 'security', 'red', 'blue']):
            return 'analyst'
            
        # Default user role
        return 'user'
    
    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        user_doc = await self.collection.find_one({"email": email})
        if user_doc:
            user_doc["id"] = str(user_doc["_id"])
            del user_doc["_id"]  # Remove the ObjectId field
            return UserInDB(**user_doc)
        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get user by ID"""
        if not ObjectId.is_valid(user_id):
            return None
            
        user_doc = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            user_doc["id"] = str(user_doc["_id"])
            del user_doc["_id"]  # Remove the ObjectId field
            return UserInDB(**user_doc)
        return None
    
    async def update_active_jwt_identifier(self, user_id: str, jti: str) -> bool:
        """Update the active JWT identifier for single-session control"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "active_jwt_identifier": jti,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    async def verify_user_session(self, user_id: str, token_jti: str) -> bool:
        """Verify if the user's session is valid (single-session control)"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return False
        
        # Check if the token's JTI matches the active JTI in database
        return user.active_jwt_identifier == token_jti
    
    async def update_user_profile(self, user_id: str, profile_data: dict) -> Optional[UserResponse]:
        """Update user profile"""
        try:
            if not ObjectId.is_valid(user_id):
                return None
            
            # Build update data, filtering out None values and reserved fields
            update_fields = {}
            allowed_fields = ['name', 'display_name', 'email', 'username', 'bio', 'profile_image']
            
            for field in allowed_fields:
                if field in profile_data and profile_data[field] is not None:
                    update_fields[field] = profile_data[field]
            
            if not update_fields:
                # No valid fields to update
                return None
            
            # Add updated timestamp
            update_fields['updated_at'] = datetime.utcnow()
            
            # Update the user in database
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_fields}
            )
            
            if result.modified_count == 0:
                return None
            
            # Fetch and return updated user
            updated_user_doc = await self.collection.find_one({"_id": ObjectId(user_id)})
            if updated_user_doc:
                updated_user_doc["id"] = str(updated_user_doc["_id"])
                del updated_user_doc["_id"]
                
                return UserResponse(
                    id=updated_user_doc["id"],
                    email=updated_user_doc["email"],
                    username=updated_user_doc["username"],
                    name=updated_user_doc["name"],
                    display_name=updated_user_doc["display_name"],
                    role=updated_user_doc["role"],
                    created_at=updated_user_doc["created_at"]
                )
            
            return None
            
        except Exception as e:
            print(f"Error updating user profile: {str(e)}")
            return None
    
    async def create_google_user(self, user_data: UserCreate, google_id: str) -> UserInDB:
        """Create a new user from Google OAuth"""
        try:
            # Check if email already exists
            existing_email = await self.collection.find_one({"email": user_data.email})
            if existing_email:
                raise ValueError("Email already exists")
            
            # Check if Google ID already exists
            existing_google = await self.collection.find_one({"google_id": google_id})
            if existing_google:
                raise ValueError("Google account already linked")
            
            # Ensure username is unique
            base_username = user_data.username
            counter = 1
            while await self.collection.find_one({"username": user_data.username}):
                user_data.username = f"{base_username}{counter}"
                counter += 1
            
            # Create user document with Google OAuth fields
            user_doc = {
                "email": user_data.email,
                "username": user_data.username,
                "name": user_data.name,
                "display_name": user_data.display_name,
                "hashed_password": SecurityUtils.hash_password("google_oauth_placeholder"),  # Placeholder for OAuth users
                "role": "user",
                "google_id": google_id,
                "oauth_provider": "google",
                "is_oauth_user": True,
                "has_custom_password": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert user
            result = await self.collection.insert_one(user_doc)
            user_doc["_id"] = str(result.inserted_id)  # Convert ObjectId to string
            user_doc["id"] = str(result.inserted_id)   # Also set id field
            
            # Return UserInDB object
            return UserInDB(**user_doc)
            
        except DuplicateKeyError:
            raise ValueError("User already exists")
        except Exception as e:
            raise Exception(f"Failed to create Google user: {str(e)}")
    
    async def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        """Get user by username (case-insensitive)"""
        # Use regex for case-insensitive username lookup
        user_doc = await self.collection.find_one({"username": {"$regex": f"^{username}$", "$options": "i"}})
        if user_doc:
            user_doc["id"] = str(user_doc["_id"])
            del user_doc["_id"]  # Remove the ObjectId field
            return UserInDB(**user_doc)
        return None
    
    async def authenticate_user(self, username: str, password: str) -> Optional[UserInDB]:
        """Authenticate user with username and password"""
        # Try to find user by username first, then by email
        user = await self.get_user_by_username(username)
        if not user:
            user = await self.get_user_by_email(username)  # Also try email as username
        
        if not user:
            return None
        
        if not SecurityUtils.verify_password(password, user.hashed_password):
            return None
        
        return user
    
    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password"""
        try:
            # Get current user
            user = await self.get_user_by_id(user_id)
            if not user:
                return False
            
            # Verify current password
            if not SecurityUtils.verify_password(current_password, user.hashed_password):
                raise ValueError("Current password is incorrect")
            
            # Hash new password
            new_hashed_password = SecurityUtils.hash_password(new_password)
            
            # Update password in database
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "hashed_password": new_hashed_password,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except ValueError:
            raise  # Re-raise validation errors
        except Exception as e:
            print(f"Error changing password: {str(e)}")
            return False

    async def set_oauth_user_password(self, user_id: str, new_password: str) -> bool:
        """Set password for OAuth user (first time password setup)"""
        try:
            # Get user
            user = await self.get_user_by_id(user_id)
            if not user:
                raise ValueError("User not found")
            
            if not user.is_oauth_user:
                raise ValueError("This method is only for OAuth users")
            
            # Hash new password
            new_hashed_password = SecurityUtils.hash_password(new_password)
            
            # Update password and mark as having custom password
            result = await self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "hashed_password": new_hashed_password,
                        "has_custom_password": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error setting OAuth user password: {str(e)}")
            return False
    
    async def store_temp_mfa_secret(self, email: str, secret: str, recovery_codes: list) -> bool:
        """Store temporary MFA secret and recovery codes (not activated yet)"""
        try:
            result = await self.collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "mfa_secret": secret,
                        "recovery_codes": recovery_codes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error storing temp MFA secret: {str(e)}")
            return False
    
    async def enable_mfa(self, email: str) -> bool:
        """Enable MFA for user (mark setup as complete)"""
        try:
            result = await self.collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "mfa_enabled": True,
                        "mfa_setup_complete": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error enabling MFA: {str(e)}")
            return False
    
    async def disable_mfa(self, email: str) -> bool:
        """Disable MFA for user (remove secret and recovery codes)"""
        try:
            result = await self.collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "mfa_enabled": False,
                        "mfa_setup_complete": False,
                        "mfa_secret": None,
                        "recovery_codes": None,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error disabling MFA: {str(e)}")
            return False
    
    async def verify_password(self, email: str, password: str) -> bool:
        """Verify user password"""
        try:
            user = await self.get_user_by_email(email)
            if not user:
                return False
            return SecurityUtils.verify_password(password, user.hashed_password)
        except Exception as e:
            print(f"Error verifying password: {str(e)}")
            return False
    
    async def update_recovery_codes(self, email: str, recovery_codes: list) -> bool:
        """Update user's recovery codes"""
        try:
            result = await self.collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "recovery_codes": recovery_codes,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating recovery codes: {str(e)}")
            return False
    
    async def use_recovery_code(self, email: str, recovery_code: str) -> bool:
        """Use a recovery code and mark it as used"""
        try:
            user = await self.get_user_by_email(email)
            if not user or not user.recovery_codes:
                return False
            
            from app.utils.mfa import mfa_utils
            success, updated_codes = mfa_utils.use_recovery_code(user.recovery_codes, recovery_code)
            
            if success:
                await self.update_recovery_codes(email, updated_codes)
                return True
            
            return False
        except Exception as e:
            print(f"Error using recovery code: {str(e)}")
            return False