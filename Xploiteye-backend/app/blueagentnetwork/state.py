"""
Blue Agent State Schema
Defines the state object for the Blue Agent LangGraph workflow
"""

from typing import TypedDict, List, Optional, Any
from datetime import datetime


class Vulnerability(TypedDict):
    """Vulnerability data structure"""
    id: Optional[str]
    port: int
    service: str
    version: str
    cve: str
    severity: str  # critical, high, medium, low
    description: Optional[str]
    impact: Optional[str]


class RemediationStrategy(TypedDict):
    """Remediation strategy from LLM"""
    cve: str
    service: str
    port: int
    strategy_points: List[str]
    estimated_complexity: str  # low, medium, high
    requires_downtime: bool


class GeneratedScript(TypedDict):
    """Generated remediation script"""
    script_content: str
    language: str  # bash, powershell, etc.
    filename: str
    backup_script: Optional[str]


class ImpactAssessment(TypedDict):
    """Impact assessment of the remediation"""
    risk_level: str  # LOW, MEDIUM, HIGH
    estimated_downtime_seconds: int
    affected_services: List[str]
    dangerous_commands: List[str]
    prerequisite_checks: List[str]
    reversible: bool
    requires_sudo: bool


class BlueAgentState(TypedDict):
    """
    Main state object for Blue Agent workflow

    Nodes:
    1. Load Vulnerabilities
    2. Fetch Remediation Strategy
    3. Generate Script
    4. Impact Assessment
    5. Package and Email
    """

    # INPUT
    vulnerability: Vulnerability
    user_email: Optional[str]

    # NODE 1: Load Vulnerabilities
    loading_status: str
    load_error: Optional[str]

    # NODE 2: Fetch Remediation Strategy
    remediation_strategy: Optional[RemediationStrategy]
    strategy_fetch_status: str
    strategy_error: Optional[str]

    # NODE 3: Generate Script
    generated_script: Optional[GeneratedScript]
    script_generation_status: str
    script_error: Optional[str]

    # NODE 4: Impact Assessment
    impact_assessment: Optional[ImpactAssessment]
    impact_assessment_status: str
    impact_error: Optional[str]

    # NODE 5: Package and Email
    package_filename: Optional[str]
    email_sent: bool
    email_status: str
    email_error: Optional[str]

    # METADATA
    workflow_start_time: datetime
    current_node: int  # 1-5
    workflow_complete: bool
    execution_errors: List[str]
