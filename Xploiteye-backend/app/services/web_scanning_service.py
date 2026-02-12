import os
import datetime
import json
import socket
import logging
import aiofiles
from urllib.parse import urlparse
from typing import Optional, Dict, Any

from config.settings import settings
from app.web_application_scanner.scanners.recon_primary import ReconScanner
from app.web_application_scanner.scanners.network_scanner import NetworkScanner
from app.web_application_scanner.scanners.ssl_scanner import SSLScanner
from app.web_application_scanner.scanners.tech_detector import TechDetector
from app.web_application_scanner.scanners.cve_mapper import CVEMapper
from app.web_application_scanner.scanners.header_check import HeaderSecurityScanner
from app.web_application_scanner.report_generator.report_orchestrator import generate_professional_report
from app.web_application_scanner.report_generator.email_service import send_scan_report_email

logger = logging.getLogger(__name__)

# Global state (should ideally be in DB)
web_scan_results = {}

async def process_web_scan(scan_id: str, url: str, user_email: Optional[str] = None, user_id: str = None):
    """
    Unified Web Application Scan Orchestrator.
    Executes: Recon -> Network -> SSL -> Tech -> Headers -> CVE Mapping -> Report.
    """
    try:
        domain = urlparse(url).netloc
        if not domain: domain = url
        try:
            target_ip = socket.gethostbyname(domain)
        except:
            target_ip = "Unknown IP"
            
        logger.info(f"[WEB-SCAN] Initiated for URL: {url} | Resolved IP: {target_ip} | ID: {scan_id}")
        
        if scan_id not in web_scan_results:
            web_scan_results[scan_id] = {
                "status": "Starting",
                "target": url,
                "user_id": user_id,
                "findings": [],
                "technologies": {}
            }
            
        web_scan_results[scan_id]["status"] = "Scanning (Network & Recon)"
        web_scan_results[scan_id]["started_at"] = datetime.datetime.now().isoformat()
        
        start_time = datetime.datetime.now()
        
        # 1. Reconnaissance
        recon = ReconScanner()
        recon_data = recon.scan(domain)
        
        # 2. Network Scanning
        network = NetworkScanner()
        open_ports = await network.scan(target_ip)
        
        # 3. SSL Analysis
        ssl_scanner = SSLScanner()
        ssl_data = ssl_scanner.scan(domain)
        
        # 4. Tech Detection
        web_scan_results[scan_id]["status"] = "Analyzing Fingerprints"
        tech_detector = TechDetector()
        detected_stack = await tech_detector.detect_technologies(url)
        
        # 5. Header Security Checks
        header_scanner = HeaderSecurityScanner()
        header_findings = await header_scanner.scan(url)
        
        # 6. CVE Mapping
        web_scan_results[scan_id]["status"] = "Mapping Vulnerabilities"
        cve_mapper = CVEMapper()
        findings = []
        
        if "findings" in header_findings:
            findings.extend(header_findings["findings"])
        
        for tech, version in detected_stack.items():
            vulns = await cve_mapper.map_to_cves(tech, version, url)
            findings.extend(vulns)
            
        # 7. Final Result Assembly
        end_time = datetime.datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        result = {
            "target": url,
            "scan_id": scan_id,
            "user_id": user_id,
            "status": "Generating Report",
            "scan_duration_sec": duration,
            "recon_data": recon_data,
            "network_ports": open_ports,
            "ssl_info": ssl_data,
            "technologies": detected_stack,
            "findings": findings,
            "completed_at": end_time.isoformat()
        }
        
        # PERSISTENCE
        output_dir = os.path.join(settings.results_dir, "web_scans")
        os.makedirs(output_dir, exist_ok=True)
        file_path = os.path.join(output_dir, f"{scan_id}.json")
        
        async with aiofiles.open(file_path, mode='w') as f:
            await f.write(json.dumps(result, indent=2))
            
        web_scan_results[scan_id] = result
        
        # 8. Report Generation
        report_dir = os.path.join(settings.reports_dir, "web_scans")
        os.makedirs(report_dir, exist_ok=True)
        report_path = os.path.join(report_dir, f"Report_{scan_id}.pdf")
        
        try:
            await generate_professional_report(scan_id, result, report_path)
            logger.info(f"[WEB-SCAN] Professional report generated: {report_path}")
            
            # Email delivery
            if user_email:
                await send_scan_report_email(user_email, scan_id, result, report_path)
                
            web_scan_results[scan_id]["status"] = "Completed"
            web_scan_results[scan_id]["report_path"] = report_path
            
        except Exception as rep_err:
            logger.error(f"[WEB-SCAN] Report generation failed: {rep_err}")
            web_scan_results[scan_id]["status"] = "Completed (Report Failed)"

    except Exception as e:
        logger.error(f"[WEB-SCAN] Critical failure for {scan_id}: {str(e)}")
        if scan_id in web_scan_results:
            web_scan_results[scan_id]["status"] = "Failed"
            web_scan_results[scan_id]["error"] = str(e)
