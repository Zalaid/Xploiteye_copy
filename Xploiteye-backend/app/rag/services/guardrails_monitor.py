"""
Xploit Eye - Guardrails Monitoring Service
Tracks blocked queries and security incidents
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from loguru import logger
from app.database.mongodb import get_database


class GuardrailsMonitor:
    """Monitor and track guardrails incidents"""
    
    def __init__(self):
        """Initialize monitor"""
        self.incidents_collection = "guardrails_incidents"
    
    async def log_incident(
        self,
        user_id: str,
        query: str,
        result: Dict,
        ip_address: Optional[str] = None
    ):
        """
        Log a guardrails incident
        
        Args:
            user_id: User ID
            query: Blocked query
            result: GuardrailResult as dict
            ip_address: Optional IP address
        """
        try:
            database = await get_database()
            
            incident = {
                "user_id": user_id,
                "query": query[:500],  # Truncate for storage
                "category": result.get("category"),
                "reason": result.get("reason"),
                "action": result.get("action"),
                "confidence": result.get("confidence", 0.0),
                "ip_address": ip_address,
                "timestamp": datetime.utcnow()
            }
            
            await database[self.incidents_collection].insert_one(incident)
            logger.info(f"📊 Logged guardrails incident: {result.get('category')} from user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to log incident: {e}")
    
    async def get_incidents(
        self,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        hours: int = 24
    ) -> List[Dict]:
        """
        Get guardrails incidents
        
        Args:
            user_id: Filter by user ID
            category: Filter by category
            hours: Last N hours
            
        Returns:
            List of incidents
        """
        try:
            database = await get_database()
            
            query_filter = {
                "timestamp": {
                    "$gte": datetime.utcnow() - timedelta(hours=hours)
                }
            }
            
            if user_id:
                query_filter["user_id"] = user_id
            
            if category:
                query_filter["category"] = category
            
            cursor = database[self.incidents_collection].find(
                query_filter
            ).sort("timestamp", -1).limit(1000)
            
            incidents = await cursor.to_list(length=1000)
            
            # Convert ObjectId to string
            for incident in incidents:
                incident["_id"] = str(incident["_id"])
            
            return incidents
            
        except Exception as e:
            logger.error(f"❌ Failed to get incidents: {e}")
            return []
    
    async def get_statistics(self, hours: int = 24) -> Dict:
        """
        Get guardrails statistics
        
        Args:
            hours: Last N hours
            
        Returns:
            Statistics dictionary
        """
        try:
            database = await get_database()
            
            start_time = datetime.utcnow() - timedelta(hours=hours)
            
            # Total incidents
            total = await database[self.incidents_collection].count_documents({
                "timestamp": {"$gte": start_time}
            })
            
            # By category
            pipeline = [
                {"$match": {"timestamp": {"$gte": start_time}}},
                {"$group": {
                    "_id": "$category",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]
            
            by_category = {}
            async for doc in database[self.incidents_collection].aggregate(pipeline):
                by_category[doc["_id"]] = doc["count"]
            
            # By user (top offenders)
            user_pipeline = [
                {"$match": {"timestamp": {"$gte": start_time}}},
                {"$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            
            top_users = []
            async for doc in database[self.incidents_collection].aggregate(user_pipeline):
                top_users.append({
                    "user_id": doc["_id"],
                    "count": doc["count"]
                })
            
            return {
                "total_incidents": total,
                "time_period_hours": hours,
                "by_category": by_category,
                "top_users": top_users
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get statistics: {e}")
            return {
                "total_incidents": 0,
                "time_period_hours": hours,
                "by_category": {},
                "top_users": []
            }


# Global monitor instance
guardrails_monitor = GuardrailsMonitor()
