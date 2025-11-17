# Red Agent Network Integration

Multi-stage exploitation workflow using LangGraph for automated penetration testing.

## Folder Structure

```
redagentnetwork/
├── __init__.py                  # Package initialization
├── services.py                  # RedAgentService - core service class
├── README.md                    # This file
│
├── nodes/                       # Workflow nodes (copy from ../../../red/nodes/)
│   ├── __init__.py
│   ├── node_1_initialization_validation.py
│   ├── node_2_exploit_discovery.py
│   ├── node_2b_gpt_pwn_rc_generation.py
│   ├── node_3_ranking_selection.py
│   ├── node_4_payload_selection.py
│   ├── node_5_exploit_execution.py
│   ├── node_5_5_gpt_fallback_exploit.py
│   ├── node_6_pwn_rc_generation.py
│   └── node_7_backup_m2_manual_exploit_to_rc.py
│
├── utils/                       # Utility modules (copy from ../../../red/utils/)
│   ├── __init__.py
│   ├── msf_client.py
│   ├── exploit_search.py
│   ├── ranking_utils.py
│   ├── payload_utils.py
│   ├── session_manager.py
│   └── logging_setup.py
│
└── routes/                      # API route handlers
    ├── __init__.py
    └── red_agent_routes.py      # Endpoint definitions
```

## Setup Instructions

### 1. Copy Required Files

Copy all files from the parent `red` folder:

```bash
# From project root: Xploiteye-backend/

# Copy nodes
cp -r red/nodes/* app/redagentnetwork/nodes/

# Copy utilities
cp -r red/utils/* app/redagentnetwork/utils/

# Copy state and graph
cp red/state.py app/redagentnetwork/
cp red/graph.py app/redagentnetwork/
```

### 2. Update Services.py

The `services.py` file imports from the red folder. After copying files, update the import path:

```python
# Current (requires red folder in path):
from graph import run_workflow
from state import RedAgentState

# Or use relative import after copying:
from .graph import run_workflow
from .state import RedAgentState
```

### 3. Update main.py

Include the red agent router in your FastAPI app:

```python
# main.py
from app.redagentnetwork.routes import router as red_agent_router

# In FastAPI setup:
app.include_router(red_agent_router)
```

### 4. Environment Variables

All required variables are already merged in `.env`:

```ini
# Metasploit RPC
MSF_RPC_HOST=127.0.0.1
MSF_RPC_PORT=55553
MSF_RPC_PASSWORD=xploiteye123
MSF_RPC_SSL=false
METASPLOIT_LHOST=192.168.0.187

# Red Agent Settings
AGENT_VERSION=1.0.0
DEBUG_MODE=true
EXPLOIT_TIMEOUT=30
LHOST=auto
DEFAULT_LPORT_RANGE=4444-9999

# And more... (see .env file)
```

### 5. Database Models

Create MongoDB collections for exploitations:

```python
# MongoDB will auto-create on first insert, but here's the schema:
{
    "exploitation_id": str,
    "user_id": str,
    "target": str,
    "port": int,
    "service": str,
    "version": str,
    "cve_ids": [str],
    "started_at": datetime,
    "completed_at": datetime,
    "status": "in_progress" | "completed" | "failed",
    "result": {
        "validated": bool,
        "sessions_opened": int,
        "is_root": bool,
        ...
    },
    "error": str
}
```

## API Endpoints

### Start Exploitation

```bash
POST /api/red-agent/start

Request:
{
    "target": "192.168.1.100",
    "port": 21,
    "service": "vsftpd",
    "version": "2.3.4",
    "cve_ids": ["CVE-2011-2523"]
}

Response:
{
    "status": "started",
    "exploitation_id": "user123_192.168.1.100_21_2024-11-16...",
    "message": "Exploitation workflow started for 192.168.1.100:21 (vsftpd)"
}
```

### Check Status

```bash
GET /api/red-agent/status/{exploitation_id}

Response:
{
    "exploitation_id": "...",
    "status": "in_progress" | "completed" | "failed",
    "result": {
        "validated": true,
        "sessions_opened": 1,
        "is_root": true,
        "primary_session_id": 1,
        "os_type": "Linux 2.6.32-34-generic",
        ...
    }
}
```

### Get History

```bash
GET /api/red-agent/history?limit=10&skip=0

Response: [
    {exploitation 1},
    {exploitation 2},
    ...
]
```

### Validate Target

```bash
POST /api/red-agent/validate-target?target=192.168.1.100

Response:
{
    "valid": true,
    "message": "Target passed validation",
    "is_local": true
}
```

## Workflow Execution Flow

```
START
  ↓
NODE 1: Initialization & Validation
  ├─ Ping target
  ├─ Check port with nmap
  ├─ Connect to Metasploit RPC
  ├─ Detect OS
  └─ Create session directories
  ↓
NODE 2: Exploit Discovery (4 Strategies)
  ├─ CVE search
  ├─ Service/Version search
  ├─ Fuzzy service search
  └─ Auxiliary modules (fallback)
  ↓
IF exploits found:
  ↓
  NODE 3: Ranking & Selection
    └─ Score and select TOP 8 exploits
  ↓
  NODE 4: Payload Selection
    └─ Select compatible payloads, detect LHOST/LPORT
  ↓
  NODE 5: Exploit Execution
    └─ Execute exploits, track sessions
  ↓
  IF session opened:
    ↓
    NODE 6: PWN.RC Generation
      └─ Upgrade to meterpreter, privilege escalation
    ↓
    END (SUCCESS)
  ELSE:
    ↓
    NODE 5.5: GPT Fallback
      └─ Generate custom exploit script
    ↓
    END

ELSE (no exploits):
  ↓
  NODE 2B: GPT PWN.RC Generation
    └─ Generate complete exploitation script
  ↓
  END
```

## Service Methods

### RedAgentService

```python
# Start exploitation
await service.start_exploitation(
    target="192.168.1.100",
    port=21,
    service="vsftpd",
    version="2.3.4",
    cve_ids=["CVE-2011-2523"],
    user=current_user
)

# Get status
await service.get_exploitation_status(
    exploitation_id="...",
    user=current_user
)

# Get history
await service.get_user_exploitations(
    user=current_user,
    limit=50,
    skip=0
)
```

## Key Features

✅ **Multi-Strategy Exploit Discovery** - CVE, service/version, fuzzy, auxiliary
✅ **Intelligent Exploit Ranking** - 1250-point scoring system
✅ **Automatic Payload Selection** - Filters for target OS
✅ **Dynamic LHOST Detection** - Environment variable + auto-detect
✅ **Session Management** - Tracks all opened sessions
✅ **GPT Fallbacks** - When Metasploit fails (Node 2B, 5.5)
✅ **Privilege Escalation** - Attempts root/admin access
✅ **Comprehensive Logging** - File + console output
✅ **Multi-User Support** - Each user's own exploitation history
✅ **Async/Background Execution** - Non-blocking workflow

## Security Notes

⚠️ **Use only on authorized targets**
⚠️ **Requires Metasploit Framework installed and running**
⚠️ **MSF_RPC_PASSWORD must be secure**
⚠️ **Only targets local networks (LAN testing)**
⚠️ **Logs contain sensitive information - protect log files**

## Configuration Files

### Environment Variables (.env)

```ini
# Metasploit RPC
MSF_RPC_HOST=127.0.0.1
MSF_RPC_PORT=55553
MSF_RPC_PASSWORD=xploiteye123
MSF_RPC_SSL=false

# Agent Settings
AGENT_VERSION=1.0.0
METASPLOIT_LHOST=192.168.0.187
EXPLOIT_TIMEOUT=30
COMMAND_TIMEOUT=15

# OpenAI (for GPT fallbacks)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Troubleshooting

### Metasploit RPC Connection Failed

```bash
# Check if msfrpcd is running
sudo systemctl status msfrpcd

# Start msfrpcd
sudo systemctl start msfrpcd

# Or start manually
msfrpcd -P xploiteye123 -S -a 127.0.0.1
```

### No Exploits Found

1. Check if target and service are correct
2. Verify MSF database is up to date: `msfdb delete && msfdb init`
3. Check logs in session folder for details

### Import Errors

Ensure files are copied from `red` folder to `redagentnetwork` folder:
- Copy all `.py` files from `red/nodes/` to `redagentnetwork/nodes/`
- Copy all `.py` files from `red/utils/` to `redagentnetwork/utils/`
- Copy `red/state.py` and `red/graph.py` to `redagentnetwork/`

## Next Steps

1. ✅ Create `redagentnetwork` folder structure
2. ✅ Create `services.py` and API routes
3. ✅ Merge environment variables
4. ⏳ Copy files from `red` folder
5. ⏳ Update `main.py` to include red agent router
6. ⏳ Create frontend dashboard for Red Agent
7. ⏳ Add database models for exploitation results
8. ⏳ Implement result visualization and reporting

## References

- Full documentation: `RED_AGENT_COMPLETE_DOCUMENTATION.md`
- Original red folder: `../../../red/`
- API documentation: See route docstrings in `red_agent_routes.py`
