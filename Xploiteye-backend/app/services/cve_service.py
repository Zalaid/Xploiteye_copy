import logging
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.cve import CVEInDB, CVEResponse, CVEUpdate
from app.models.user import UserInDB


class CVEService:
    def __init__(self):
        self.db = None
        self.collection = None

    async def get_database(self):
        """Get database connection"""
        if self.db is None:
            from app.database import get_database
            self.db = await get_database()
            self.collection = self.db.cves
        return self.db

    async def store_cves_from_scan(self, scan_id: str, user: UserInDB, target: str, cves_data: List[dict]) -> List[str]:
        """Store CVEs found during scan into database"""
        try:
            await self.get_database()
            stored_cve_ids = []

            logging.info(f"Storing CVEs for scan {scan_id}: {len(cves_data)} vulnerabilities")
            logging.info(f"Sample CVE data: {cves_data[:2] if cves_data else 'No data'}")

            for cve_data in cves_data:
                # Check if CVE already exists for this user and target
                existing_cve = await self.collection.find_one({
                    "cve_id": cve_data.get("cve_id", ""),
                    "user_id": str(user.id),
                    "target": target
                })

                if not existing_cve:
                    # Create proper description based on CVE data
                    cve_id = cve_data.get("cve_id", f"VULN-{ObjectId()}")
                    port = cve_data.get("port", "")
                    service = cve_data.get("service", "unknown")
                    severity = cve_data.get("severity", "medium").lower()
                    cvss_score = cve_data.get("cvss_score")

                    # Create detailed description with CVE information
                    if cve_id.startswith("CVE-"):
                        if service == "ftp":
                            description = f"FTP Service Vulnerability - {cve_id} - {severity.title()} severity remote code execution vulnerability"
                        elif service == "ssh":
                            description = f"SSH Service Vulnerability - {cve_id} - {severity.title()} severity authentication bypass vulnerability"
                        elif service == "http":
                            description = f"HTTP Service Vulnerability - {cve_id} - {severity.title()} severity web server vulnerability"
                        elif service == "netbios-ssn":
                            description = f"NetBIOS Session Service Vulnerability - {cve_id} - {severity.title()} severity SMB vulnerability"
                        elif service == "domain":
                            description = f"DNS Service Vulnerability - {cve_id} - {severity.title()} severity DNS server vulnerability"
                        else:
                            description = f"{service.title()} Service Vulnerability - {cve_id} - {severity.title()} severity vulnerability"
                    else:
                        description = f"{severity.title()} vulnerability found in {service} service on port {port}"

                    # Parse CVSS score properly
                    try:
                        if cvss_score and cvss_score != "Not Available":
                            cvss_float = float(cvss_score)
                        else:
                            cvss_float = None
                    except (ValueError, TypeError):
                        cvss_float = None

                    # Determine exploitability based on severity and CVE presence
                    exploitable = severity in ['critical', 'high'] and cve_id.startswith("CVE-")

                    cve = CVEInDB(
                        cve_id=cve_id,
                        severity=severity,
                        cvss_score=cvss_float,
                        description=description,
                        exploitable=exploitable,
                        remediated=False,
                        privilege_escalation=severity == 'critical',
                        port=str(port) if port else None,
                        service=service,
                        scan_id=scan_id,
                        user_id=str(user.id),
                        target=target,
                        discovered_at=datetime.utcnow()
                    )

                    result = await self.collection.insert_one(cve.dict(by_alias=True))
                    stored_cve_ids.append(str(result.inserted_id))
                    logging.info(f"Stored new CVE: {cve.cve_id} for scan {scan_id}")
                else:
                    logging.info(f"CVE {cve_data.get('cve_id')} already exists for user {user.id}")

            return stored_cve_ids

        except Exception as e:
            logging.error(f"Error storing CVEs for scan {scan_id}: {e}")
            return []

    async def get_user_cves(self, user: UserInDB, target: Optional[str] = None) -> List[CVEResponse]:
        """Get all CVEs for a user, optionally filtered by target"""
        try:
            await self.get_database()
            query = {"user_id": str(user.id)}
            if target:
                query["target"] = target

            cursor = self.collection.find(query).sort("discovered_at", -1)
            cves = []

            async for cve_doc in cursor:
                cve_doc["id"] = str(cve_doc["_id"])
                cves.append(CVEResponse(**cve_doc))

            return cves

        except Exception as e:
            logging.error(f"Error fetching CVEs for user {user.id}: {e}")
            return []

    async def update_cve(self, cve_id: str, user: UserInDB, update_data: CVEUpdate) -> bool:
        """Update CVE status (remediated, exploitable)"""
        try:
            await self.get_database()
            result = await self.collection.update_one(
                {"_id": ObjectId(cve_id), "user_id": str(user.id)},
                {"$set": update_data.dict(exclude_unset=True)}
            )

            if result.modified_count > 0:
                logging.info(f"Updated CVE {cve_id} for user {user.id}")
                return True
            return False

        except Exception as e:
            logging.error(f"Error updating CVE {cve_id}: {e}")
            return False

    async def get_cve_by_id(self, cve_id: str, user: UserInDB) -> Optional[CVEResponse]:
        """Get specific CVE by ID"""
        try:
            await self.get_database()
            cve_doc = await self.collection.find_one({
                "_id": ObjectId(cve_id),
                "user_id": str(user.id)
            })

            if cve_doc:
                cve_doc["id"] = str(cve_doc["_id"])
                return CVEResponse(**cve_doc)
            return None

        except Exception as e:
            logging.error(f"Error fetching CVE {cve_id}: {e}")
            return None

    async def delete_cve(self, cve_id: str, user: UserInDB) -> bool:
        """Delete CVE"""
        try:
            await self.get_database()
            result = await self.collection.delete_one({
                "_id": ObjectId(cve_id),
                "user_id": str(user.id)
            })

            if result.deleted_count > 0:
                logging.info(f"Deleted CVE {cve_id} for user {user.id}")
                return True
            return False

        except Exception as e:
            logging.error(f"Error deleting CVE {cve_id}: {e}")
            return False