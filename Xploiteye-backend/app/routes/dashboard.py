"""
Protected dashboard routes
"""

from fastapi import APIRouter, Depends
from app.models.user import UserInDB, UserResponse
from app.auth.dependencies import get_current_user, get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get(
    "/",
    summary="Dashboard home",
    description="Protected dashboard endpoint - requires valid authentication"
)
async def dashboard_home(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Protected dashboard home endpoint
    
    This endpoint demonstrates the single-session authentication system.
    Only users with valid, active sessions can access this endpoint.
    """
    return {
        "message": f"Welcome to XploitEye Dashboard, {current_user.display_name}!",
        "user_id": str(current_user.id),
        "email": current_user.email,
        "dashboard_sections": [
            "Vulnerability Scanning",
            "Red Agent Operations", 
            "Blue Agent Defense",
            "Security Reports",
            "RAG Chatbot Assistant"
        ]
    }

@router.get(
    "/scanning",
    summary="Scanning module",
    description="Vulnerability scanning dashboard"
)
async def scanning_dashboard(
    current_user: UserInDB = Depends(get_current_user)
):
    """Scanning module dashboard"""
    return {
        "module": "Vulnerability Scanning",
        "user": current_user.display_name,
        "available_scans": [
            "Web Application Scan",
            "Network Infrastructure Scan", 
            "Domain Security Scan"
        ],
        "scan_modes": ["Light", "Medium", "Deep"]
    }

@router.get(
    "/red-agent",
    summary="Red Agent module", 
    description="Red team operations dashboard"
)
async def red_agent_dashboard(
    current_user: UserInDB = Depends(get_current_user)
):
    """Red Agent operations dashboard"""
    return {
        "module": "Red Agent Operations",
        "user": current_user.display_name,
        "capabilities": [
            "Exploit Module Management",
            "Payload Generation",
            "Attack Simulation",
            "CVE Exploitation"
        ]
    }

@router.get(
    "/blue-agent", 
    summary="Blue Agent module",
    description="Blue team defense dashboard"
)
async def blue_agent_dashboard(
    current_user: UserInDB = Depends(get_current_user)
):
    """Blue Agent defense dashboard"""
    return {
        "module": "Blue Agent Defense",
        "user": current_user.display_name,
        "capabilities": [
            "Threat Detection",
            "Incident Response",
            "Defense Automation", 
            "Security Monitoring"
        ]
    }

@router.get(
    "/reports",
    summary="Reports module",
    description="Security reports dashboard"
)
async def reports_dashboard(
    current_user: UserInDB = Depends(get_current_user)
):
    """Security reports dashboard"""
    return {
        "module": "Security Reports", 
        "user": current_user.display_name,
        "report_types": [
            "Vulnerability Assessment Report",
            "Penetration Testing Report",
            "Compliance Report",
            "Executive Summary"
        ]
    }

@router.get(
    "/settings",
    summary="Settings module",
    description="User and system settings"
)
async def settings_dashboard(
    current_user: UserInDB = Depends(get_current_user)
):
    """Settings dashboard"""
    return {
        "module": "Settings",
        "user": current_user.display_name,
        "settings_categories": [
            "User Profile",
            "Security Preferences", 
            "Notification Settings",
            "System Configuration"
        ]
    }