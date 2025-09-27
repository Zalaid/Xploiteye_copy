"""
User Image Service for handling profile image storage and management with GridFS
"""

import uuid
from datetime import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection, AsyncIOMotorGridFSBucket
from bson import ObjectId
from app.models.user_image import UserImageCreate, UserImageInDB, UserImageResponse
import io

class UserImageService:
    """Service for managing user profile images with GridFS"""
    
    def __init__(self, database: AsyncIOMotorDatabase = None):
        from app.database.mongodb import db
        self.database = database or db.database
        self.collection: AsyncIOMotorCollection = self.database.user_images
        self.gridfs_bucket = AsyncIOMotorGridFSBucket(self.database, bucket_name="user_profile_images")
    
    async def save_user_image(self, user_id: str, file_content: bytes, original_filename: str, mime_type: str, custom_filename: str = None) -> Optional[UserImageResponse]:
        """Save user profile image to GridFS"""
        try:
            # Generate filename - use custom if provided, otherwise use user_id with UUID
            import os
            file_extension = os.path.splitext(original_filename)[1].lower()
            if custom_filename:
                # Use provided custom filename (should include extension)
                unique_filename = custom_filename
                if not unique_filename.endswith(file_extension):
                    unique_filename = f"{custom_filename}{file_extension}"
            else:
                unique_filename = f"{user_id}_{uuid.uuid4()}{file_extension}"
            
            # Get previous image before upload to delete later
            previous_image = await self.get_user_image(user_id)
            
            # Upload new file to GridFS
            file_stream = io.BytesIO(file_content)
            gridfs_id = await self.gridfs_bucket.upload_from_stream(
                unique_filename,
                file_stream,
                metadata={
                    "user_id": user_id,
                    "original_filename": original_filename,
                    "mime_type": mime_type,
                    "file_size": len(file_content),
                    "created_at": datetime.utcnow()
                }
            )
            
            # Create new image record
            image_data = UserImageInDB(
                user_id=user_id,
                filename=unique_filename,
                original_filename=original_filename,
                file_size=len(file_content),
                mime_type=mime_type,
                gridfs_id=str(gridfs_id),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Delete and recreate database record to ensure clean state
            await self.collection.delete_many({"user_id": user_id})
            result = await self.collection.insert_one(image_data.dict(by_alias=True, exclude={"id"}))
            
            # Delete previous image from GridFS after successful database update
            if previous_image:
                try:
                    previous_gridfs_id = ObjectId(previous_image.gridfs_id)
                    await self.gridfs_bucket.delete(previous_gridfs_id)
                except Exception as delete_error:
                    print(f"Warning: Could not delete previous image: {delete_error}")
                    # Continue anyway - new image is saved successfully
            
            # Get the final record to return
            final_record = await self.get_user_image(user_id)
            if final_record:
                return final_record
            else:
                # Fallback response
                return UserImageResponse(
                    id=str(gridfs_id),
                    user_id=user_id,
                    filename=unique_filename,
                    original_filename=original_filename,
                    file_size=len(file_content),
                    mime_type=mime_type,
                    gridfs_id=str(gridfs_id),
                    created_at=image_data.created_at
                )
            
        except Exception as e:
            print(f"Error saving user image: {str(e)}")
            import traceback
            print(f"Full error: {traceback.format_exc()}")
            return None
    
    async def get_user_image(self, user_id: str) -> Optional[UserImageResponse]:
        """Get user's current profile image"""
        try:
            image_doc = await self.collection.find_one({"user_id": user_id})
            if image_doc:
                image_doc["id"] = str(image_doc["_id"])
                del image_doc["_id"]
                return UserImageResponse(**image_doc)
            return None
        except Exception as e:
            print(f"Error getting user image: {str(e)}")
            return None
    
    async def get_image_data(self, user_id: str) -> Optional[bytes]:
        """Get user's profile image binary data from GridFS"""
        try:
            # Get image record
            image_record = await self.get_user_image(user_id)
            if not image_record:
                return None
            
            # Download from GridFS
            gridfs_id = ObjectId(image_record.gridfs_id)
            file_stream = io.BytesIO()
            await self.gridfs_bucket.download_to_stream(gridfs_id, file_stream)
            file_stream.seek(0)
            return file_stream.read()
            
        except Exception as e:
            print(f"Error getting image data: {str(e)}")
            return None
    
    async def delete_user_image(self, user_id: str) -> bool:
        """Delete user's current profile image from GridFS"""
        try:
            # Get current image
            current_image = await self.get_user_image(user_id)
            if current_image:
                # Delete from GridFS
                gridfs_id = ObjectId(current_image.gridfs_id)
                await self.gridfs_bucket.delete(gridfs_id)
                
                # Delete from database
                await self.collection.delete_many({"user_id": user_id})
            
            return True
        except Exception as e:
            print(f"Error deleting user image: {str(e)}")
            return False
    
    def get_image_url(self, user_id: str) -> str:
        """Get public URL for user image"""
        return f"/auth/profile-image/{user_id}"