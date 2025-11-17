"""
Red Agent Network - Multi-stage exploitation workflow
Integrates LangGraph-based red agent with XploitEye backend
"""

__version__ = "1.0.0"
__name__ = "redagentnetwork"

from .services import RedAgentService

__all__ = ["RedAgentService"]
