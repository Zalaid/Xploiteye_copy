# XploitEye Backend

Secure FastAPI backend for the XploitEye multi-agentic cybersecurity platform.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with single-session control
- 🛡️ **Password Security**: bcrypt password hashing
- 📊 **MongoDB Integration**: Async MongoDB operations with Motor
- 🚀 **FastAPI Framework**: Modern, fast web framework with automatic API docs
- 🐳 **Containerized**: Docker and Docker Compose ready
- 🔧 **Environment Config**: Environment-based configuration management

## Quick Start

### Prerequisites

- Python 3.11+
- MongoDB (or use Docker Compose)
- Node.js (for frontend integration)

### Local Development

1. **Clone and Setup**
   ```bash
   cd xploiteye-backend
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB** (if not using Docker)
   ```bash
   # Install and start MongoDB locally
   mongod --dbpath /path/to/your/db
   ```

4. **Run the Application**
   ```bash
   python main.py
   ```

### Docker Development

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

This will start both the backend API and MongoDB.

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login (returns JWT)
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout user

### Dashboard (Protected)

- `GET /dashboard/` - Dashboard home
- `GET /dashboard/scanning` - Scanning module
- `GET /dashboard/red-agent` - Red Agent module
- `GET /dashboard/blue-agent` - Blue Agent module
- `GET /dashboard/reports` - Reports module
- `GET /dashboard/settings` - Settings module

### Health

- `GET /` - API status
- `GET /health` - Health check

## Authentication Flow

1. **Registration**: User registers with email/password
2. **Login**: User logs in, receives JWT token
3. **Single Session**: Only one active session per user (old tokens invalidated)
4. **Protected Access**: Dashboard endpoints require valid JWT
5. **Session Validation**: Each request validates token against database

## Project Structure

```
xploiteye-backend/
├── app/
│   ├── auth/              # Authentication utilities
│   ├── database/          # Database configuration
│   ├── models/            # Pydantic models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── config/                # Configuration settings
├── tests/                 # Test files
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker configuration
└── docker-compose.yml   # Docker Compose setup
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT tokens with expiration
- ✅ Single-session control per user
- ✅ Input validation with Pydantic
- ✅ CORS configuration
- ✅ Environment-based secrets

## Frontend Integration

The backend is configured to work with the XploitEye frontend:

- CORS enabled for `http://localhost:3000` and `http://localhost:3001`
- JWT tokens returned for client-side storage
- RESTful API design for easy integration

## Development

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Environment Variables

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=xploiteye
JWT_SECRET_KEY=your-super-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:3000"]
```

## Deployment

1. **Production Environment**
   ```bash
   # Set production environment variables
   export JWT_SECRET_KEY="your-production-secret-key"
   export MONGODB_URL="your-production-mongodb-url"
   
   # Run with production server
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Docker Production**
   ```bash
   docker build -t xploiteye-backend .
   docker run -p 8000:8000 -e JWT_SECRET_KEY="..." xploiteye-backend
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the XploitEye cybersecurity platform.