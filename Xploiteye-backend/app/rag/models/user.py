"""
Xploit Eye - User Model
"""
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from pydantic_core import core_schema
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom ObjectId type for Pydantic v2"""
    
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler):
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ],
        serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x)
        ))
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class User(BaseModel):
    """User database model"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True


class UserCreate(BaseModel):
    """User registration schema"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@xploiteye.com",
                "username": "security_analyst",
                "password": "SecurePass123!"
            }
        }
    )
    
    email: EmailStr
    username: str
    password: str = Field(min_length=8, max_length=100)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response schema (without password)"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "user@xploiteye.com",
                "username": "security_analyst",
                "created_at": "2024-01-01T00:00:00",
                "last_login": "2024-01-02T10:30:00",
                "is_active": True
            }
        }
    )
    
    id: str
    email: EmailStr
    username: str
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool
