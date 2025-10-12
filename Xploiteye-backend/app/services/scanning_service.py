"""
Network Scanning Service for XploitEye Backend
Integrates with the scanner engine and manages scan operations
"""

import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

from app.models.scan import ScanRequest, ScanResponse, ScanStatus, ScanType, ScanResults, ReportResponse
from app.models.user import UserInDB
from app.scanning.scanner_engine import execute_scan_with_controller
from app.scanning.report_generator.gpt_prompts import generate_full_report
from app.scanning.report_generator.pdf_generator import generate_pdf_report
from app.services.cve_service import CVEService
from app.services.email_service import EmailService
from app.database.mongodb import get_database
from config.settings import settings
from config.logging_config import scanning_logger

class ScanningService:
    """Service for managing network scans"""

    def __init__(self):
        self.active_scans: Dict[str, Dict] = {}
        self.db = None
        self.pdf_generation_queue: List[Dict] = []
        self.pdf_worker_running = False

    async def get_database(self):
        """Get database connection"""
        if self.db is None:
            self.db = await get_database()
        return self.db

    async def start_scan(self, scan_request: ScanRequest, user: UserInDB) -> ScanResponse:
        """Start a new network scan"""
        scan_id = str(uuid.uuid4())
        started_at = datetime.utcnow()

        # Create scan record
        scan_data = {
            "scan_id": scan_id,
            "status": ScanStatus.PENDING,
            "target": scan_request.target,
            "scan_type": scan_request.scan_type,
            "user_id": user.id,
            "started_at": started_at,
            "completed_at": None,
            "results": None,
            "json_file_path": None,
            "txt_file_path": None,
            "errors": [],
            "user": user.dict()  # Store user data for automatic PDF generation
        }

        # Store in memory and database
        self.active_scans[scan_id] = scan_data

        try:
            db = await self.get_database()
            await db.scans.insert_one(scan_data)
        except Exception as e:
            logging.error(f"Failed to save scan to database: {e}")

        # Start scan in background
        asyncio.create_task(self._execute_scan(scan_id, scan_request, user))

        return ScanResponse(
            scan_id=scan_id,
            status=ScanStatus.PENDING,
            message=f"Started {scan_request.scan_type} scan on {scan_request.target}",
            target=scan_request.target,
            scan_type=scan_request.scan_type,
            user_id=user.id,
            started_at=started_at
        )

    async def _execute_scan(self, scan_id: str, scan_request: ScanRequest, user: UserInDB):
        """Execute the actual scan in background"""
        try:
            # Update status to running
            await self._update_scan_status(scan_id, ScanStatus.RUNNING, "Scan in progress...")

            # Execute the scan using the scanner engine
            logging.info(f"Starting scan {scan_id}: {scan_request.scan_type} scan on {scan_request.target}")

            scan_results = await execute_scan_with_controller(
                scan_type=scan_request.scan_type.value,
                target=scan_request.target,
                user_id=user.id,
                scan_id=scan_id
            )

            completed_at = datetime.utcnow()

            if scan_results.get("status") == "failed":
                await self._update_scan_status(
                    scan_id,
                    ScanStatus.FAILED,
                    f"Scan failed: {scan_results.get('error', 'Unknown error')}",
                    completed_at=completed_at,
                    results=scan_results
                )
            else:
                # Construct the JSON file path based on scan parameters
                scan_data = self.active_scans.get(scan_id)
                if scan_data:
                    user_id = scan_data.get("user_id")
                    target = scan_data.get("target")
                    scan_type_raw = scan_data.get("scan_type")
                    # Convert enum to string if needed
                    scan_type = scan_type_raw.value if hasattr(scan_type_raw, 'value') else str(scan_type_raw)
                    target_clean = target.replace('.', '_').replace(':', '_').replace('/', '_')

                    # Search for existing JSON files matching the new pattern with scan_id
                    file_pattern_new = f"{user_id}_{target_clean}_{scan_type}_{scan_id}_scan_"
                    file_pattern_old = f"{user_id}_{target_clean}_{scan_type}_scan_"
                    json_file_path = None

                    try:
                        # Look for files in results directory that match our pattern (try new pattern first)
                        import glob
                        pattern_path_new = os.path.join(settings.results_dir, f"{file_pattern_new}*.json")
                        pattern_path_old = os.path.join(settings.results_dir, f"{file_pattern_old}*.json")

                        matching_files = glob.glob(pattern_path_new)
                        if not matching_files:
                            # Fallback to old pattern for backward compatibility
                            matching_files = glob.glob(pattern_path_old)
                            logging.info(f"🔄 Trying old pattern: {pattern_path_old}")

                        if matching_files:
                            # Get the most recent file (in case there are multiple)
                            json_file_path = max(matching_files, key=os.path.getctime)
                            logging.info(f"✅ FOUND MATCHING JSON FILE: {json_file_path}")
                        else:
                            logging.warning(f"❌ NO MATCHING JSON FILES FOUND: new_pattern={pattern_path_new}, old_pattern={pattern_path_old}")
                    except Exception as e:
                        logging.error(f"❌ ERROR SEARCHING FOR JSON FILES: {e}")

                    if not json_file_path:
                        # Fallback to constructed path with new naming pattern
                        timestamp = completed_at.strftime("%Y%m%d_%H%M%S")
                        json_filename = f"{user_id}_{target_clean}_{scan_type}_{scan_id}_scan_{timestamp}.json"
                        json_file_path = os.path.join(settings.results_dir, json_filename)

                    logging.info(f"🔍 FINAL JSON PATH: {json_file_path}")
                    logging.info(f"🔍 JSON FILE EXISTS: {os.path.exists(json_file_path)}")
                else:
                    json_file_path = scan_results.get("json_file_path")

                await self._update_scan_status(
                    scan_id,
                    ScanStatus.COMPLETED,
                    "Scan completed successfully",
                    completed_at=completed_at,
                    results=scan_results,
                    json_file_path=json_file_path,
                    txt_file_path=scan_results.get("txt_file_path")
                )

                logging.info(f"Scan {scan_id} completed successfully")

                # Store CVEs in database
                await self._store_scan_cves(scan_id, scan_results)

                # Mark that PDF generation is needed for this scan
                await self._mark_scan_for_pdf_generation(scan_id, user.dict())
                logging.info(f"Scan {scan_id} completed. Marked for background PDF generation.")

        except Exception as e:
            logging.error(f"Scan {scan_id} failed with exception: {e}")
            await self._update_scan_status(
                scan_id,
                ScanStatus.FAILED,
                f"Scan failed with error: {str(e)}",
                completed_at=datetime.utcnow()
            )

    async def _update_scan_status(self, scan_id: str, status: ScanStatus, message: str,
                                completed_at: Optional[datetime] = None,
                                results: Optional[Dict] = None,
                                json_file_path: Optional[str] = None,
                                txt_file_path: Optional[str] = None):
        """Update scan status in memory and database"""
        if scan_id in self.active_scans:
            self.active_scans[scan_id]["status"] = status
            self.active_scans[scan_id]["message"] = message
            if completed_at:
                self.active_scans[scan_id]["completed_at"] = completed_at
            if results:
                self.active_scans[scan_id]["results"] = results
            if json_file_path:
                self.active_scans[scan_id]["json_file_path"] = json_file_path
            if txt_file_path:
                self.active_scans[scan_id]["txt_file_path"] = txt_file_path

        # Update in database
        try:
            db = await self.get_database()
            update_data = {
                "status": status.value,
                "message": message
            }
            if completed_at:
                update_data["completed_at"] = completed_at
            if results:
                update_data["results"] = results
            if json_file_path:
                update_data["json_file_path"] = json_file_path
            if txt_file_path:
                update_data["txt_file_path"] = txt_file_path

            await db.scans.update_one(
                {"scan_id": scan_id},
                {"$set": update_data}
            )
        except Exception as e:
            logging.error(f"Failed to update scan in database: {e}")

    async def get_scan_status(self, scan_id: str, user: UserInDB) -> Optional[ScanResponse]:
        """Get scan status and results"""
        # Check memory first
        if scan_id in self.active_scans:
            scan_data = self.active_scans[scan_id]
        else:
            # Check database
            try:
                db = await self.get_database()
                scan_data = await db.scans.find_one({"scan_id": scan_id})
                if not scan_data:
                    return None
            except Exception as e:
                logging.error(f"Failed to retrieve scan from database: {e}")
                return None

        # Verify user ownership
        if scan_data["user_id"] != user.id:
            return None

        # Load actual JSON results if scan is completed and JSON file exists
        results = scan_data.get("results")
        json_file_path = scan_data.get("json_file_path")

        logging.info(f"🔍 SCAN STATUS DEBUG: scan_id={scan_id}, status={scan_data.get('status')}, json_file_path={json_file_path}")

        if (scan_data.get("status") == "completed" and json_file_path and os.path.exists(json_file_path)):
            try:
                logging.info(f"🔍 LOADING JSON FILE: {json_file_path}")
                with open(json_file_path, 'r', encoding='utf-8') as f:
                    json_results = json.load(f)
                    # Override results with actual JSON content
                    results = json_results
                    logging.info(f"✅ JSON LOADED: {len(json_results.get('vulnerabilities', []))} vulnerabilities, {len(json_results.get('services', []))} services, {json_results.get('summary', {}).get('ports_scanned', 0)} ports scanned")
            except Exception as e:
                logging.error(f"❌ FAILED TO LOAD JSON: {e}")
        else:
            if scan_data.get("status") == "completed":
                # File is missing - mark scan as completed_file_missing to stop polling
                if json_file_path and not os.path.exists(json_file_path):
                    logging.warning(f"⚠️ SCAN COMPLETED BUT JSON FILE MISSING: {json_file_path}")
                    # Update scan status to stop endless polling
                    try:
                        db = await self.get_database()
                        if db is not None:
                            await db.scans.update_one(
                                {"scan_id": scan_data["scan_id"]},
                                {"$set": {"status": "completed_file_missing", "message": "Scan completed but result file is missing"}}
                            )
                            # Update in-memory status too
                            scan_data["status"] = "completed_file_missing"
                            scan_data["message"] = "Scan completed but result file is missing"
                            logging.info(f"📝 Updated scan {scan_data['scan_id']} status to completed_file_missing")
                    except Exception as e:
                        logging.error(f"Failed to update scan status: {e}")
                else:
                    logging.info(f"🔄 SCAN COMPLETED BUT NO JSON PATH SET: status={scan_data.get('status')}")
            else:
                logging.info(f"🔄 SCAN NOT COMPLETED YET: status={scan_data.get('status')}")

        return ScanResponse(
            scan_id=scan_data["scan_id"],
            status=ScanStatus(scan_data["status"]),
            message=scan_data.get("message", ""),
            target=scan_data["target"],
            scan_type=ScanType(scan_data["scan_type"]),
            user_id=scan_data["user_id"],
            started_at=scan_data["started_at"],
            completed_at=scan_data.get("completed_at"),
            results=results,
            json_file_path=scan_data.get("json_file_path"),
            txt_file_path=scan_data.get("txt_file_path")
        )

    async def get_user_scans(self, user: UserInDB, limit: int = 50, skip: int = 0) -> List[ScanResponse]:
        """Get all scans for a user"""
        try:
            db = await self.get_database()
            cursor = db.scans.find(
                {"user_id": user.id}
            ).sort("started_at", -1).skip(skip).limit(limit)

            scans = []
            async for scan_data in cursor:
                scans.append(ScanResponse(
                    scan_id=scan_data["scan_id"],
                    status=ScanStatus(scan_data["status"]),
                    message=scan_data.get("message", ""),
                    target=scan_data["target"],
                    scan_type=ScanType(scan_data["scan_type"]),
                    user_id=scan_data["user_id"],
                    started_at=scan_data["started_at"],
                    completed_at=scan_data.get("completed_at"),
                    results=scan_data.get("results"),
                    json_file_path=scan_data.get("json_file_path")
                ))

            return scans

        except Exception as e:
            logging.error(f"Failed to retrieve user scans: {e}")
            return []

    async def cancel_scan(self, scan_id: str, user: UserInDB) -> bool:
        """Cancel a running scan"""
        scan_data = await self.get_scan_status(scan_id, user)
        if not scan_data:
            return False

        if scan_data.status not in [ScanStatus.PENDING, ScanStatus.RUNNING]:
            return False

        await self._update_scan_status(
            scan_id,
            ScanStatus.CANCELLED,
            "Scan cancelled by user",
            completed_at=datetime.utcnow()
        )

        return True

    async def generate_pdf_report(self, scan_id: str, user: UserInDB, report_name: Optional[str] = None) -> ReportResponse:
        """Generate PDF report from scan results using ISO-standard professional format"""
        scan_data = await self.get_scan_status(scan_id, user)
        if not scan_data:
            return ReportResponse(
                status="error",
                message="Scan not found",
                scan_id=scan_id
            )

        if scan_data.status != ScanStatus.COMPLETED:
            return ReportResponse(
                status="error",
                message="Scan not completed",
                scan_id=scan_id
            )

        # Check if both JSON and TXT files exist (required for ISO report)
        json_file_path = scan_data.json_file_path
        txt_file_path = getattr(scan_data, 'txt_file_path', None)

        if not json_file_path or not os.path.exists(json_file_path):
            return ReportResponse(
                status="error",
                message="JSON scan results file not found",
                scan_id=scan_id
            )

        if not txt_file_path or not os.path.exists(txt_file_path):
            return ReportResponse(
                status="error",
                message="TXT CVE details file not found",
                scan_id=scan_id
            )

        try:
            # Generate report name if not provided
            if not report_name:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                target_clean = scan_data.target.replace('.', '_').replace(':', '_')
                report_name = f"ISO_Security_Report_{user.id}_{target_clean}_{scan_data.scan_type.value}_{timestamp}.pdf"

            # Ensure .pdf extension
            if not report_name.endswith('.pdf'):
                report_name += '.pdf'

            # Setup output path
            reports_dir = settings.reports_dir
            os.makedirs(reports_dir, exist_ok=True)
            output_path = os.path.join(reports_dir, report_name)

            # Use NEW ISO-standard report generator
            logging.info(f"🚀 Generating ISO-standard professional report for scan {scan_id}...")
            logging.info(f"📂 JSON: {json_file_path}")
            logging.info(f"📂 TXT: {txt_file_path}")
            logging.info(f"📄 Output: {output_path}")

            # Import the new ISO report generator
            from app.scanning.report_generator.gpt_prompts import generate_iso_report
            import asyncio
            from concurrent.futures import ThreadPoolExecutor

            # Run the synchronous PDF generation in a thread pool to avoid blocking the event loop
            # This ensures the scan status can be returned to frontend immediately while PDF generates in background
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                result = await loop.run_in_executor(
                    executor,
                    generate_iso_report,
                    json_file_path,
                    txt_file_path,
                    output_path
                )

            if result["status"] == "success":
                logging.info(f"✅ ISO report generated successfully: {output_path}")
                logging.info(f"📊 Vulnerabilities: {result.get('total_vulnerabilities', 0)}")
                logging.info(f"📈 Severity: {result.get('severity_breakdown', {})}")

                return ReportResponse(
                    status="success",
                    message="Professional ISO-standard security report generated successfully",
                    pdf_file=report_name,
                    pdf_path=output_path,
                    scan_id=scan_id
                )
            else:
                logging.error(f"❌ ISO report generation failed: {result.get('message', 'Unknown error')}")
                return ReportResponse(
                    status="error",
                    message=result.get("message", "PDF generation failed"),
                    scan_id=scan_id
                )

        except Exception as e:
            logging.error(f"❌ Failed to generate ISO report for scan {scan_id}: {e}")
            import traceback
            traceback.print_exc()
            return ReportResponse(
                status="error",
                message=f"Report generation failed: {str(e)}",
                scan_id=scan_id
            )

    async def _store_scan_cves(self, scan_id: str, scan_results: Dict):
        """Store CVEs found in scan to database"""
        try:
            scan_data = self.active_scans.get(scan_id)
            if not scan_data:
                logging.warning(f"No active scan data found for {scan_id}")
                return

            user_data = scan_data.get("user")
            target = scan_data.get("target", "unknown")

            # Recreate UserInDB object
            from app.models.user import UserInDB
            user = UserInDB(**user_data)

            # Load actual JSON file if available for more complete data
            actual_scan_data = scan_results
            json_file_path = scan_results.get("json_file_path")
            if json_file_path and os.path.exists(json_file_path):
                try:
                    with open(json_file_path, 'r', encoding='utf-8') as f:
                        actual_scan_data = json.load(f)
                        logging.info(f"Loaded complete JSON data from {json_file_path}")
                except Exception as e:
                    logging.error(f"Failed to load JSON file {json_file_path}: {e}")

            # Extract CVEs from scan results
            cves_data = []

            # Check different possible locations for vulnerability data
            if "vulnerabilities" in actual_scan_data:
                vulnerabilities = actual_scan_data["vulnerabilities"]
                logging.info(f"Found {len(vulnerabilities)} vulnerabilities in scan results")
                for vuln in vulnerabilities:
                    # Use the correct field names from the JSON structure
                    cve_data = {
                        "cve_id": vuln.get("cve_id", f"VULN-{len(cves_data) + 1}"),  # Fixed: use cve_id not cve
                        "severity": vuln.get("severity", "medium").lower(),
                        "cvss_score": vuln.get("cvss_score"),
                        "description": vuln.get("description", "Vulnerability found during scan"),
                        "exploitable": vuln.get("exploitable", False),
                        "privilege_escalation": vuln.get("privilege_escalation", False),
                        "port": vuln.get("port"),
                        "service": vuln.get("service")
                    }
                    cves_data.append(cve_data)
                    logging.info(f"Added CVE: {cve_data['cve_id']} on port {cve_data['port']} service {cve_data['service']}")

            # Also check summary for CVE count and create generic entries if needed
            if "summary" in scan_results and scan_results["summary"].get("cves_found", 0) > len(cves_data):
                cves_found = scan_results["summary"]["cves_found"]

                # Create generic CVE entries for the remaining count
                for i in range(len(cves_data), cves_found):
                    cve_data = {
                        "cve_id": f"CVE-{scan_id}-{i+1}",
                        "severity": "medium",
                        "description": f"Vulnerability #{i+1} discovered during {scan_results['summary'].get('scan_type', 'network')} scan",
                        "exploitable": False,
                        "privilege_escalation": False
                    }
                    cves_data.append(cve_data)

            # Store CVEs in database
            if cves_data:
                cve_service = CVEService()
                stored_ids = await cve_service.store_cves_from_scan(scan_id, user, target, cves_data)
                logging.info(f"Stored {len(stored_ids)} CVEs for scan {scan_id}")
            else:
                logging.info(f"No CVEs to store for scan {scan_id}")

        except Exception as e:
            logging.error(f"Error storing CVEs for scan {scan_id}: {e}")

    async def _generate_auto_pdf_report(self, scan_id: str, user_data: Dict):
        """Automatically generate PDF report after scan completion and send via email"""
        try:
            # Recreate UserInDB object from stored data
            from app.models.user import UserInDB
            user = UserInDB(**user_data)

            # Generate the PDF report
            result = await self.generate_pdf_report(scan_id, user)

            if result.status == "success":
                logging.info(f"Automatic PDF report generated successfully for scan {scan_id}: {result.pdf_file}")

                # Send email with PDF attachment
                try:
                    # Get scan data to extract target and scan type
                    scan_data = await self.get_scan_status(scan_id, user)
                    if scan_data and user.email:
                        db = await self.get_database()
                        email_service = EmailService(db)

                        email_sent = await email_service.send_scan_report_email(
                            to_email=user.email,
                            scan_target=scan_data.target,
                            scan_type=scan_data.scan_type.value,
                            pdf_path=result.pdf_path
                        )

                        if email_sent:
                            logging.info(f"PDF report emailed successfully to {user.email} for scan {scan_id}")
                        else:
                            logging.error(f"Failed to email PDF report to {user.email} for scan {scan_id}")
                    else:
                        logging.warning(f"Cannot send email for scan {scan_id}: missing scan data or user email")

                except Exception as email_error:
                    logging.error(f"Error sending email for scan {scan_id}: {email_error}")
                    # Don't fail the entire process if email fails

            else:
                logging.error(f"Automatic PDF report generation failed for scan {scan_id}: {result.message}")

        except Exception as e:
            logging.error(f"Error in automatic PDF report generation for scan {scan_id}: {e}")


    async def _mark_scan_for_pdf_generation(self, scan_id: str, user_data: Dict):
        """Mark scan for background PDF generation"""
        try:
            # Add to PDF generation queue
            pdf_task = {
                "scan_id": scan_id,
                "user_data": user_data,
                "timestamp": datetime.utcnow()
            }
            self.pdf_generation_queue.append(pdf_task)
            logging.info(f"Added scan {scan_id} to PDF generation queue")

            # Start the PDF worker if not already running
            if not self.pdf_worker_running:
                asyncio.create_task(self._pdf_generation_worker())

        except Exception as e:
            logging.error(f"Error marking scan for PDF generation: {e}")

    async def _pdf_generation_worker(self):
        """Background worker to process PDF generation queue"""
        if self.pdf_worker_running:
            return

        self.pdf_worker_running = True
        logging.info("PDF generation worker started")

        try:
            while self.pdf_generation_queue:
                try:
                    # Wait a bit to ensure scan completion is fully processed
                    await asyncio.sleep(5)

                    # Get the next task
                    pdf_task = self.pdf_generation_queue.pop(0)
                    scan_id = pdf_task["scan_id"]
                    user_data = pdf_task["user_data"]

                    logging.info(f"Processing PDF generation for scan {scan_id}")

                    # Generate PDF and send email
                    await self._generate_auto_pdf_report(scan_id, user_data)

                    logging.info(f"Completed PDF generation for scan {scan_id}")

                except Exception as e:
                    logging.error(f"Error in PDF generation worker: {e}")

        except Exception as e:
            logging.error(f"PDF generation worker error: {e}")
        finally:
            self.pdf_worker_running = False
            logging.info("PDF generation worker stopped")

    def _format_scan_results_to_text(self, scan_results: Dict) -> str:
        """Format scan results JSON to text for GPT processing"""
        try:
            text_parts = []

            # Add summary
            if "summary" in scan_results:
                summary = scan_results["summary"]
                text_parts.append("SCAN SUMMARY:")
                text_parts.append(f"Target: {summary.get('target', 'N/A')}")
                text_parts.append(f"Scan Type: {summary.get('scan_type', 'N/A')}")
                text_parts.append(f"Duration: {summary.get('scan_duration', 'N/A')}s")
                text_parts.append(f"Timestamp: {summary.get('timestamp', 'N/A')}")
                text_parts.append(f"Ports Scanned: {summary.get('ports_scanned', 'N/A')}")
                text_parts.append(f"Open Ports: {summary.get('open_ports', 'N/A')}")
                text_parts.append(f"CVEs Found: {summary.get('cves_found', 'N/A')}")
                text_parts.append(f"Risk Score: {summary.get('risk_score', 'N/A')}/10")
                text_parts.append(f"Risk Level: {summary.get('risk_level', 'N/A')}")
                text_parts.append("")

            # Add services
            if "services" in scan_results and scan_results["services"]:
                text_parts.append("DETECTED SERVICES:")
                for service in scan_results["services"]:
                    if isinstance(service, dict):
                        port = service.get('port', 'N/A')
                        svc_name = service.get('service', 'N/A')
                        version = service.get('version', 'N/A')
                        protocol = service.get('protocol', 'tcp')
                        text_parts.append(f"  Port {port}/{protocol}: {svc_name} {version}")
                text_parts.append("")

            # Add vulnerabilities
            if "vulnerabilities" in scan_results and scan_results["vulnerabilities"]:
                text_parts.append("VULNERABILITIES FOUND:")
                for vuln in scan_results["vulnerabilities"]:
                    if isinstance(vuln, dict):
                        text_parts.append(f"  Port {vuln.get('port', 'N/A')}: {vuln.get('cve_id', 'N/A')} - {vuln.get('severity', 'N/A')}")
                text_parts.append("")

            # Add risk assessment
            if "risk_assessment" in scan_results:
                risk = scan_results["risk_assessment"]
                text_parts.append("RISK ASSESSMENT:")
                text_parts.append(f"Risk Score: {risk.get('risk_score', 'N/A')}/10")
                text_parts.append(f"Risk Level: {risk.get('risk_level', 'N/A')}")
                if "recommendations" in risk and isinstance(risk["recommendations"], list):
                    text_parts.append("Recommendations:")
                    for rec in risk["recommendations"]:
                        text_parts.append(f"  - {rec}")
                text_parts.append("")

            return "\n".join(text_parts)

        except Exception as e:
            logging.error(f"Failed to format scan results to text: {e}")
            return json.dumps(scan_results, indent=2)

    async def get_available_reports(self, user: UserInDB) -> List[Dict[str, Any]]:
        """Get list of available PDF reports for user"""
        try:
            reports_dir = settings.reports_dir
            if not os.path.exists(reports_dir):
                logging.warning(f"Reports directory does not exist: {reports_dir}")
                return []

            reports = []
            for filename in os.listdir(reports_dir):
                # Match both old pattern (ISO_Security_Report_{user_id}_...) and new pattern ({user_id}_...)
                if filename.endswith('.pdf'):
                    # Check if file belongs to user - match ISO_Security_Report_{user_id}_ or {user_id}_
                    if f"_{user.id}_" in filename or filename.startswith(f"{user.id}_"):
                        filepath = os.path.join(reports_dir, filename)
                        stat = os.stat(filepath)

                        # Extract metadata from filename for better display
                        # Try to parse scan_id, target, scan_type from filename
                        scan_id = "unknown"
                        target = "unknown"
                        scan_type = "unknown"
                        generated_at = datetime.fromtimestamp(stat.st_ctime).isoformat()

                        # Parse filename to extract information
                        # Format: ISO_Security_Report_{user_id}_{target}_{scan_type}_{timestamp}.pdf
                        try:
                            if filename.startswith("ISO_Security_Report_"):
                                parts = filename.replace("ISO_Security_Report_", "").replace(".pdf", "").split("_")
                                if len(parts) >= 3:
                                    # Skip user_id (first part), get target and scan_type
                                    target = "_".join(parts[1:-2])  # Everything except first (user_id) and last 2 (scan_type, timestamp)
                                    scan_type = parts[-2] if len(parts) >= 2 else "unknown"
                                    # Convert target back to readable format
                                    target = target.replace('_', '.')
                        except Exception as parse_error:
                            logging.warning(f"Could not parse filename {filename}: {parse_error}")

                        reports.append({
                            "filename": filename,
                            "filepath": filepath,
                            "scan_id": scan_id,
                            "target": target,
                            "scan_type": scan_type,
                            "generated_at": generated_at,
                            "file_size": stat.st_size,
                            "status": "completed"
                        })

            # Sort by creation time, newest first
            reports.sort(key=lambda x: x["generated_at"], reverse=True)

            logging.info(f"Found {len(reports)} reports for user {user.id} in {reports_dir}")
            return reports

        except Exception as e:
            logging.error(f"Failed to list reports for user {user.id}: {e}")
            import traceback
            traceback.print_exc()
            return []

# Global service instance
_scanning_service = None

def get_scanning_service() -> ScanningService:
    """Get or create the scanning service instance"""
    global _scanning_service
    if _scanning_service is None:
        _scanning_service = ScanningService()
    return _scanning_service