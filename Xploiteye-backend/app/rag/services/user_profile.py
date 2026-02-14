"""
Xploit Eye - User Profile Service

Stores structured per-user profile data (like display name) in MongoDB.
This complements vector-based user memory for clear, overrideable facts.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from loguru import logger

from app.database.mongodb import get_database


class UserProfileService:
    """Manage structured user profile information."""

    def __init__(self) -> None:
        self.collection_name = "user_profiles"

    async def set_name(self, user_id: str, name: str) -> None:
        """
        Set or update the user's display name.

        Args:
            user_id: User ID
            name: Display name to store
        """
        try:
            database = await get_database()
            normalized_name = name.strip()

            if not normalized_name:
                return

            await database[self.collection_name].update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "name": normalized_name,
                        "updated_at": datetime.utcnow(),
                    }
                },
                upsert=True,
            )

            logger.info(f"🧾 Updated user profile name for user {user_id}: {normalized_name}")

        except Exception as e:
            logger.error(f"❌ Failed to set user profile name for {user_id}: {e}")

    async def get_name(self, user_id: str) -> Optional[str]:
        """
        Get the user's stored display name, if any.

        Args:
            user_id: User ID

        Returns:
            Name string or None if not set
        """
        try:
            database = await get_database()
            doc: Optional[Dict[str, Any]] = await database[self.collection_name].find_one(
                {"user_id": user_id},
                {"_id": 0, "name": 1},
            )

            if not doc:
                return None

            return doc.get("name")

        except Exception as e:
            logger.error(f"❌ Failed to get user profile name for {user_id}: {e}")
            return None

    async def set_study_place(self, user_id: str, place: str) -> None:
        """
        Set or update where the user studies (e.g. university/college).

        Args:
            user_id: User ID
            place: Name of institution
        """
        try:
            database = await get_database()
            normalized_place = place.strip()

            if not normalized_place:
                return

            await database[self.collection_name].update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "study_place": normalized_place,
                        "updated_at": datetime.utcnow(),
                    }
                },
                upsert=True,
            )

            logger.info(f"🧾 Updated study place for user {user_id}: {normalized_place}")

        except Exception as e:
            logger.error(f"❌ Failed to set study place for {user_id}: {e}")

    async def get_study_place(self, user_id: str) -> Optional[str]:
        """
        Get where the user studies, if stored.

        Args:
            user_id: User ID

        Returns:
            Study place string or None
        """
        try:
            database = await get_database()
            doc: Optional[Dict[str, Any]] = await database[self.collection_name].find_one(
                {"user_id": user_id},
                {"_id": 0, "study_place": 1},
            )

            if not doc:
                return None

            return doc.get("study_place")

        except Exception as e:
            logger.error(f"❌ Failed to get study place for {user_id}: {e}")
            return None


# Global user profile service instance
user_profile_service = UserProfileService()

