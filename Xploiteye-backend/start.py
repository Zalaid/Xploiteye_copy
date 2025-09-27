#!/usr/bin/env python3
"""
Quick start script for XploitEye Backend
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🚀 Starting XploitEye Backend...")
    
    # Check if we're in the correct directory
    if not Path("main.py").exists():
        print("❌ Error: main.py not found. Make sure you're in the xploiteye-backend directory.")
        sys.exit(1)
    
    # Check if virtual environment exists
    venv_path = Path("venv")
    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"])
    
    # Determine the correct python executable
    if os.name == 'nt':  # Windows
        python_exe = venv_path / "Scripts" / "python.exe"
        pip_exe = venv_path / "Scripts" / "pip.exe"
    else:  # Unix/Linux/MacOS
        python_exe = venv_path / "bin" / "python"
        pip_exe = venv_path / "bin" / "pip"
    
    # Install requirements
    if not Path("requirements_installed.flag").exists():
        print("📚 Installing requirements...")
        subprocess.run([str(pip_exe), "install", "-r", "requirements.txt"])
        Path("requirements_installed.flag").touch()
    
    # Create .env file if it doesn't exist
    if not Path(".env").exists():
        print("⚙️  Creating .env file...")
        with open(".env", "w") as f:
            f.write("""# XploitEye Backend Environment Variables
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=xploiteye
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
""")
    
    print("🔥 Starting FastAPI server...")
    print("📍 API will be available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop")
    print("-" * 50)
    
    # Start the server
    try:
        subprocess.run([str(python_exe), "main.py"])
    except KeyboardInterrupt:
        print("\n✅ Backend stopped successfully!")

if __name__ == "__main__":
    main()