"""
MongoDB database connection and configuration
"""

import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config.settings import settings

class Database:
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None

# Global database instance
db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = AsyncIOMotorClient(settings.mongodb_url)
        db.database = db.client[settings.mongodb_database]
        
        # Test the connection with longer timeout
        await db.client.admin.command('ping')
        print(f">> Connected to MongoDB: {settings.mongodb_database}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        print(f">> Failed to connect to MongoDB: {e}")
        print(">> Continuing without database - some features may not work")
        # Don't crash the app, just continue
        db.client = None
        db.database = None

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print(">> Disconnected from MongoDB")

async def create_indexes():
    """Create necessary database indexes"""
    try:
        # User indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("username", unique=True)

        # Payment transaction indexes (separate collection)
        await db.database.payment_transactions.create_index("basket_id", unique=True)
        await db.database.payment_transactions.create_index("user_id")
        await db.database.payment_transactions.create_index("transaction_id")
        await db.database.payment_transactions.create_index([("user_id", 1), ("status", 1)])

        # Subscription indexes (separate collection)
        await db.database.subscriptions.create_index("user_id")
        await db.database.subscriptions.create_index([("user_id", 1), ("status", 1)])

        # Webhook indexes (separate collection)
        await db.database.payment_webhooks.create_index("basket_id")
        await db.database.payment_webhooks.create_index("transaction_id")

        # Refund indexes (separate collection)
        await db.database.payment_refunds.create_index("transaction_id")
        await db.database.payment_refunds.create_index("user_id")

        print(">> Created database indexes (including payment collections)")
    except Exception as e:
        print(f">> Index creation warning: {e}")

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db.database