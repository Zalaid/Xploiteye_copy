from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.services.cve_service import CVEService
from app.models.cve import CVEResponse, CVEUpdate
from app.auth.dependencies import get_current_user
from app.models.user import UserInDB

router = APIRouter(prefix="/cve", tags=["CVE Management"])


@router.get("/list", response_model=List[CVEResponse])
async def get_user_cves(
    target: Optional[str] = Query(None, description="Filter by target"),
    user: UserInDB = Depends(get_current_user)
):
    """Get all CVEs for the current user"""
    cve_service = CVEService()
    cves = await cve_service.get_user_cves(user, target)
    return cves


@router.get("/{cve_id}", response_model=CVEResponse)
async def get_cve(
    cve_id: str,
    user: UserInDB = Depends(get_current_user)
):
    """Get specific CVE by ID"""
    cve_service = CVEService()
    cve = await cve_service.get_cve_by_id(cve_id, user)

    if not cve:
        raise HTTPException(status_code=404, detail="CVE not found")

    return cve


@router.patch("/{cve_id}")
async def update_cve(
    cve_id: str,
    update_data: CVEUpdate,
    user: UserInDB = Depends(get_current_user)
):
    """Update CVE status (remediated, exploitable)"""
    cve_service = CVEService()
    success = await cve_service.update_cve(cve_id, user, update_data)

    if not success:
        raise HTTPException(status_code=404, detail="CVE not found or update failed")

    return {"message": "CVE updated successfully"}


@router.delete("/{cve_id}")
async def delete_cve(
    cve_id: str,
    user: UserInDB = Depends(get_current_user)
):
    """Delete CVE"""
    cve_service = CVEService()
    success = await cve_service.delete_cve(cve_id, user)

    if not success:
        raise HTTPException(status_code=404, detail="CVE not found or deletion failed")

    return {"message": "CVE deleted successfully"}