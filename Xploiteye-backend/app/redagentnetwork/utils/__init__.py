"""
Red Agent Utilities Package


  What it does:

  BEFORE (without init.py):
  # In node_2.py, you'd have to do:
  from utils.session_manager import create_session_directory
  from utils.msf_client import connect_to_msf_rpc
  from utils.exploit_search import search_exploits
  # Long and annoying!

  AFTER (with init.py):
  # In node_2.py, clean import:
  from utils import create_session_directory, connect_to_msf_rpc, search_exploits
  # All in one line!"""
  
from .session_manager import create_session_directory
from .msf_client import connect_to_msf_rpc, test_msf_connection
from .logging_setup import setup_logger
from .exploit_search import (
    get_module_path,
    extract_major_minor_version,
    search_exploits,
    module_to_dict,
    is_exploit_module,
    is_auxiliary_module,
    rank_to_score,
    meets_rank_requirement,
    deduplicate_exploits,
    sort_exploits,
    filter_exploits_smart,
)

__all__ = [
    'create_session_directory',
    'connect_to_msf_rpc',
    'test_msf_connection',
    'setup_logger',
    'get_module_path',
    'extract_major_minor_version',
    'search_exploits',
    'module_to_dict',
    'is_exploit_module',
    'is_auxiliary_module',
    'rank_to_score',
    'meets_rank_requirement',
    'deduplicate_exploits',
    'sort_exploits',
    'filter_exploits_smart',
]
