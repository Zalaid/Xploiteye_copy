"""
Ranking Utilities
Helper functions for exploit ranking and selection
"""

from typing import List, Dict, Tuple
from utils.exploit_search import rank_to_score  # Import from exploit_search to avoid duplication


def calculate_os_compatibility_score(exploit_platform: str, target_os: str) -> int:
    """
    Calculate OS compatibility score between exploit platform and target OS.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        Windows exploits CANNOT run on Linux targets (and vice versa)!

        Example disaster without this check:
            ❌ Try MS17-010 EternalBlue (Windows SMB) on Linux vsftpd → FAILS (wrong OS)
            ❌ Waste 5 minutes waiting for timeout
            ❌ Try 5 more Windows exploits → ALL FAIL
            ❌ Total waste: 30 minutes on incompatible exploits

    SOLUTION:
        Check OS compatibility BEFORE trying exploits!
        Give HUGE PENALTY (-1000) to incompatible exploits so they get filtered out.

    HOW IT HELPS:
        ✅ SAVES TIME: Skip incompatible exploits entirely (don't even try them)
        ✅ INCREASES SUCCESS: Only try exploits that CAN work on target OS
        ✅ AUTO-FILTER: Negative score (-1000) removes exploit from list

        Example with this function:
            Exploit A (unix on Linux): +100 points → KEEP ✅
            Exploit B (windows on Linux): -1000 points → FILTER OUT ❌
            Result: Only try exploit A (saves 5+ minutes)

    WHEN IT'S USED:
        Called by calculate_final_score() for EVERY exploit
        Part of the scoring formula to rank exploits

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        exploit_platform: Exploit platform (e.g., "unix", "linux", "windows")
        target_os: Target OS (e.g., "Linux 2.6.9", "Windows 7")

    Returns:
        Compatibility score (100 = perfect match, -1000 = incompatible)

    Example 1 - Perfect match:
        Input:  exploit_platform = "unix"
                target_os = "Linux 2.6.9"
        Code:   "linux" in "linux 2.6.9".lower()  # True ✅
                "unix" in compatible platforms ["unix", "linux"]
        Output: 100 (unix works on Linux)

    Example 2 - Linux/Unix match:
        Input:  exploit_platform = "linux"
                target_os = "Linux 2.6.9 - 2.6.33"
        Code:   "linux" in "linux 2.6.9 - 2.6.33".lower()  # True ✅
        Output: 100 (perfect match)

    Example 3 - Incompatible (Windows on Linux):
        Input:  exploit_platform = "windows"
                target_os = "Linux 2.6.9"
        Code:   "linux" in "linux 2.6.9".lower()  # True
                "windows" NOT in compatible platforms ["unix", "linux"]
        Output: -1000 (incompatible - will be filtered out!)

    Example 4 - Unknown OS:
        Input:  exploit_platform = "unix"
                target_os = "unknown"
        Code:   target_os_lower = "unknown"
                No platform detected, generic platform = "unix"
        Output: 50 (might work, give it a chance)

    WHY -1000 for incompatible?
        -1000 is a HUGE penalty that ensures incompatible exploits are:
        1. Sorted to the BOTTOM of the list
        2. Filtered out completely (negative score = bad)
        3. Never selected for execution

        Example ranking with -1000:
            Exploit A: 1000 + 50 + 100 + 100 = 1250 ← Selected #1
            Exploit B: 800 + 40 + 75 + 100 = 1015  ← Selected #2
            Exploit C: 1000 + 50 - 1000 = 50       ← FILTERED OUT (incompatible OS)

    What it does: Checks if exploit's platform is compatible with target OS.
                  Returns high score for matches, massive penalty for mismatches.
    """
    if not target_os or target_os == "unknown":
        # Unknown OS - give generic exploits a chance
        if exploit_platform.lower() in ["unix", "linux", "multi"]:
            return 100  # Might work
        return 0

    target_os_lower = target_os.lower()
    platform_lower = exploit_platform.lower()

    # Detect target OS type
    if "linux" in target_os_lower or "unix" in target_os_lower:
        compatible_platforms = ["unix", "linux", "multi"]
        if platform_lower in compatible_platforms:
            return 100  # Perfect match
        elif not platform_lower:
            # Empty platform on Linux target - assume compatible (most Linux exploits don't set explicit platform)
            return 75  # Give benefit of doubt for Linux targets
        else:
            return -1000  # Incompatible (e.g., Windows exploit on Linux)

    elif "windows" in target_os_lower:
        if platform_lower in ["windows", "multi"]:
            return 100
        else:
            return -1000  # Linux exploit on Windows

    elif "bsd" in target_os_lower:
        if platform_lower in ["bsd", "unix", "multi"]:
            return 100
        else:
            return -1000

    # Unknown target OS, check for generic platforms
    if platform_lower in ["unix", "linux", "multi"]:
        return 100
    else:
        return 0


def calculate_version_match_score(exploit_info: Dict, target_version: str) -> int:
    """
    Calculate version matching score.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        Not all exploits work on all versions!

        Example:
            Target: vsftpd 2.3.4 (vulnerable to backdoor)
            Exploit A: vsftpd_234_backdoor (targets 2.3.4 specifically) → WORKS ✅
            Exploit B: vsftpd_230_exec (targets 2.3.0 only) → FAILS ❌
            Exploit C: generic_ftp_exploit (no version check) → MIGHT WORK ⚠️

        Without version checking:
            ❌ Try exploit B (wrong version) → Fails
            ❌ Try exploit C (generic) → Low success rate
            ❌ Waste time on wrong-version exploits

    SOLUTION:
        Score exploits based on version matching!
        Exact match (2.3.4 = 2.3.4) → +100 points (highest priority)
        Close match (2.3.x matches 2.3.4) → +75 points (good chance)
        Fuzzy match (2.x matches 2.3.4) → +25 points (might work)
        No match → 0 points (last resort)

    HOW IT HELPS:
        ✅ PRIORITIZE exact version matches (highest success rate)
        ✅ TRY close matches next (compatible versions)
        ✅ SAVE generic exploits for last (lowest confidence)

        Example with this function:
            Exploit A (exact 2.3.4): +100 → RANK #1 (try first!)
            Exploit B (2.3.0): 0 → RANK #3 (try last)
            Exploit C (generic): 0 → RANK #3 (try last)

    REAL IMPACT:
        Target: OpenSSH 7.4p1
        Without scoring: Try 10 SSH exploits randomly (30 min)
        With scoring: Try openssh_7_4 exploit first (success in 1 min!)

    WHEN IT'S USED:
        Called by calculate_final_score() for EVERY exploit
        Helps rank exploits by version compatibility

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        exploit_info: Exploit dictionary with path, name, description
        target_version: Target version string (e.g., "2.3.4")

    Returns:
        Version match score (100 = exact, 75 = close, 25 = fuzzy, 0 = no match)

    Example 1 - Exact version in path:
        Input:  exploit_info = {"path": "exploit/unix/ftp/vsftpd_234_backdoor", "name": "VSFTPD 2.3.4"}
                target_version = "2.3.4"
        Code:   "234" in "vsftpd_234_backdoor"  # True ✅
        Output: 100 (exact match - highest confidence!)

    Example 2 - Exact version in name:
        Input:  exploit_info = {"path": "exploit/linux/ssh/openssh_exploit", "name": "OpenSSH 7.4p1 RCE"}
                target_version = "7.4p1"
        Code:   "7.4p1" in "openssh 7.4p1 rce".lower()  # True ✅
        Output: 100

    Example 3 - Close version match (major.minor):
        Input:  exploit_info = {"path": "exploit/unix/ssh/openssh_7_4", "name": "OpenSSH"}
                target_version = "7.4p1"
        Code:   version_clean = "74"
                "74" in "openssh_7_4"  # True ✅
        Output: 75 (close match - major.minor matches)

    Example 4 - Fuzzy match (major version):
        Input:  exploit_info = {"path": "exploit/unix/ssh/openssh_7x", "name": "OpenSSH 7.x"}
                target_version = "7.4p1"
        Code:   major_version = "7"
                "7" in "openssh_7x"  # True ✅
        Output: 25 (fuzzy match - might work)

    Example 5 - No version info:
        Input:  exploit_info = {"path": "exploit/unix/ssh/generic_ssh", "name": "Generic SSH"}
                target_version = "7.4p1"
        Code:   No version found in path or name
        Output: 0 (no version info - unknown compatibility)

    WHAT IS version_clean? Why do we remove dots?
        version_clean removes dots and special chars to match different formats.

        Problem: Same version can be written different ways:
            - "2.3.4"      ← Dotted notation
            - "234"        ← Concatenated (in module paths)
            - "2_3_4"      ← Underscore notation
            - "v2.3.4"     ← With prefix

        Solution: Remove all separators, keep just numbers:
            "2.3.4" → "234"
            "2_3_4" → "234"
            "v2.3.4" → "v234" → "234"

        Example:
            target_version = "2.3.4"
            version_clean = "2.3.4".replace(".", "").replace("_", "")  # "234"

            exploit path = "exploit/unix/ftp/vsftpd_234_backdoor"
            Check: "234" in "vsftpd_234_backdoor"  # True ✅

            Without version_clean:
            Check: "2.3.4" in "vsftpd_234_backdoor"  # False ❌

    What it does: Compares exploit's version info with target version.
                  Higher scores for exact matches, lower for fuzzy matches.
    """
    if not target_version:
        return 0

    exploit_path = exploit_info.get("path", "").lower()
    exploit_name = exploit_info.get("name", "").lower()
    target_version_lower = target_version.lower()

    # Remove common separators for flexible matching
    version_clean = target_version_lower.replace(".", "").replace("_", "").replace("-", "")

    # EXACT VERSION MATCH (highest confidence)
    # Check if version appears exactly in path or name
    if target_version_lower in exploit_path or target_version_lower in exploit_name:
        return 100  # Perfect match

    # Check cleaned version (e.g., "234" from "2.3.4")
    if version_clean and len(version_clean) >= 2:
        if version_clean in exploit_path or version_clean in exploit_name:
            return 100

    # CLOSE VERSION MATCH (major.minor)
    # Extract major.minor from version (e.g., "7.4" from "7.4p1")
    if "." in target_version:
        parts = target_version.split(".")
        major_minor = ".".join(parts[:2])  # "7.4p1" → "7.4"

        if major_minor in exploit_path or major_minor in exploit_name:
            return 75

        # Try cleaned major.minor (e.g., "74" from "7.4")
        major_minor_clean = major_minor.replace(".", "")
        if major_minor_clean in exploit_path or major_minor_clean in exploit_name:
            return 75

    # FUZZY VERSION MATCH (major version only)
    # Extract first number from version
    major_version = ""
    for char in target_version:
        if char.isdigit():
            major_version += char
        elif major_version:
            break  # Stop at first non-digit after digits

    if major_version and len(major_version) >= 1:
        # Look for major version in path/name
        if major_version in exploit_path or major_version in exploit_name:
            return 25

    # No version match
    return 0


# NOTE: rank_to_score() function is imported from exploit_search.py to avoid duplication
# It converts MSF rank strings (excellent/great/good/normal/average/low/manual) to numeric scores


def calculate_discovery_score(matched_by: str) -> int:
    """
    Get discovery method score (from Node 2).

    Args:
        matched_by: Discovery method ("cve", "service_version", "fuzzy", "auxiliary")

    Returns:
        Discovery score (1000 = CVE, 800 = service, 400 = fuzzy)

    Example 1:
        Input:  "cve"
        Output: 1000 (found by CVE - most targeted)

    Example 2:
        Input:  "service_version"
        Output: 800 (found by service+version - very reliable)

    Example 3:
        Input:  "fuzzy"
        Output: 400 (found by service name only - less targeted)

    What it does: Returns the score that was assigned in Node 2.
                  CVE > Service+Version > Fuzzy
    """
    scores = {
        "cve": 1000,
        "service_version": 800,
        "fuzzy": 400,
        "auxiliary": 100,
    }
    return scores.get(matched_by.lower(), 0)


def calculate_final_score(
    exploit_info: Dict,
    target_os: str,
    target_version: str
) -> Tuple[int, Dict[str, int]]:
    """
    Calculate final ranking score for an exploit.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        We have 4 DIFFERENT criteria to evaluate each exploit:
        1. Discovery method (CVE/Service/Fuzzy) → Score from Node 2
        2. Exploit rank (excellent/good/manual) → Quality indicator
        3. Version match (exact/close/fuzzy) → Compatibility
        4. OS compatibility (unix/windows/linux) → Can it run?

        How do we combine these into ONE decision?
        Which exploit is BEST when one has good rank but wrong version,
        and another has exact version but manual rank?

    SOLUTION:
        COMBINE all 4 criteria into a SINGLE final score!
        Formula: final_score = discovery + rank + version + os_compatibility

        Example calculation:
            vsftpd_234_backdoor:
                1000 (CVE) + 50 (excellent) + 100 (exact 2.3.4) + 100 (unix/Linux)
                = 1250 points → RANK #1

    WHY THIS HELPS:
        ✅ SINGLE NUMBER for comparison (1250 vs 530 - clear winner!)
        ✅ BALANCED decision (considers ALL factors, not just one)
        ✅ AUTOMATIC filtering (negative scores = incompatible OS)
        ✅ SORTABLE list (1250 > 530 > 401 - clear order)

    REAL EXAMPLE - Decision Making:

        Exploit A: Windows SMB (MS17-010)
            1000 (CVE) + 50 (excellent) + 0 (no version) + (-1000) (Windows on Linux)
            = 50 points → FILTERED OUT ❌

        Exploit B: vsftpd backdoor
            1000 (CVE) + 50 (excellent) + 100 (exact 2.3.4) + 100 (unix/Linux)
            = 1250 points → RANK #1 ✅

        Exploit C: Generic SSH
            400 (fuzzy) + 30 (good) + 0 (no version) + 100 (unix/Linux)
            = 530 points → RANK #2 ✅

        Clear winner: Exploit B (1250) > C (530) > A (50 filtered)

    WHAT THE BREAKDOWN DOES:
        Shows HOW we calculated the score (for debugging/transparency)

        Example breakdown:
        {
            "discovery": 1000,      ← From CVE search
            "rank": 50,             ← Excellent rank
            "version": 100,         ← Exact version match
            "os_compatibility": 100 ← Unix on Linux = compatible
        }

        User can see: "95% confidence because CVE + excellent + exact version + compatible OS"

    WHEN IT'S USED:
        Called by rank_exploits() for EVERY exploit from Node 2
        Determines execution order (highest score = try first)

    ═══════════════════════════════════════════════════════════════════════════

    Formula:
        final_score = discovery_score + rank_score + version_score + os_compatibility

    Args:
        exploit_info: Exploit dictionary from Node 2
        target_os: Target OS (e.g., "Linux 2.6.9")
        target_version: Target version (e.g., "2.3.4")

    Returns:
        Tuple of (final_score, score_breakdown)

    Example 1 - High-quality CVE exploit:
        Input:  exploit_info = {
                    "path": "exploit/unix/ftp/vsftpd_234_backdoor",
                    "name": "VSFTPD 2.3.4 Backdoor",
                    "rank": "excellent",
                    "matched_by": "cve",
                    "platform": "unix"
                }
                target_os = "Linux 2.6.9"
                target_version = "2.3.4"

        Calculation:
            discovery_score = calculate_discovery_score("cve")              # 1000
            rank_score = rank_to_score("excellent")                         # 50
            version_score = calculate_version_match_score(...)              # 100 (exact match)
            os_score = calculate_os_compatibility_score("unix", "Linux...")  # 100 (compatible)

            final_score = 1000 + 50 + 100 + 100 = 1250

        Output: (1250, {
                    "discovery": 1000,
                    "rank": 50,
                    "version": 100,
                    "os_compatibility": 100
                })

    Example 2 - Incompatible exploit (Windows on Linux):
        Input:  exploit_info = {
                    "path": "exploit/windows/smb/ms17_010",
                    "rank": "excellent",
                    "matched_by": "cve",
                    "platform": "windows"
                }
                target_os = "Linux 2.6.9"

        Calculation:
            discovery_score = 1000
            rank_score = 50
            version_score = 0 (no version match)
            os_score = -1000 (Windows on Linux - INCOMPATIBLE!)

            final_score = 1000 + 50 + 0 - 1000 = 50

        Output: (50, {
                    "discovery": 1000,
                    "rank": 50,
                    "version": 0,
                    "os_compatibility": -1000
                })
        Note: This exploit will be FILTERED OUT (negative OS score)

    Example 3 - Fuzzy match with no version info:
        Input:  exploit_info = {
                    "path": "exploit/unix/ssh/generic_ssh",
                    "rank": "good",
                    "matched_by": "fuzzy",
                    "platform": "unix"
                }
                target_os = "Linux 2.6.9"
                target_version = "7.4p1"

        Calculation:
            discovery_score = 400 (fuzzy search)
            rank_score = 30 (good rank)
            version_score = 0 (no version match)
            os_score = 100 (unix/Linux compatible)

            final_score = 400 + 30 + 0 + 100 = 530

        Output: (530, {
                    "discovery": 400,
                    "rank": 30,
                    "version": 0,
                    "os_compatibility": 100
                })

    What it does: Combines all scoring criteria into one final score.
                  Higher score = better chance of success.
                  Negative scores (from OS incompatibility) filter out bad exploits.
    """
    # Get individual scores
    discovery_score = exploit_info.get("score", calculate_discovery_score(exploit_info.get("matched_by", "")))
    rank_score = rank_to_score(exploit_info.get("rank", "unknown"))  # Use imported function
    version_score = calculate_version_match_score(exploit_info, target_version)
    os_score = calculate_os_compatibility_score(
        exploit_info.get("platform", ""),
        target_os
    )

    # Calculate final score
    final_score = discovery_score + rank_score + version_score + os_score

    # Breakdown for debugging/logging
    breakdown = {
        "discovery": discovery_score,
        "rank": rank_score,
        "version": version_score,
        "os_compatibility": os_score,
    }

    return final_score, breakdown


def rank_exploits(
    exploits: List[Dict],
    target_os: str,
    target_version: str
) -> List[Dict]:
    """
    Rank exploits by final score.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        Node 2 gave us 10 exploits in RANDOM order (based on search results)
        We need them in PRIORITY order (best first, worst last)

        Example mess without ranking:
            [exploit #5 (manual, 401 pts), exploit #2 (excellent, 1250 pts), ...]
            Which one to try first? No idea! Random = inefficient.

    SOLUTION:
        SCORE each exploit, then SORT by score (highest first)
        Output: Clean ordered list ready for execution

        Example:
            Input (random): [E5, E2, E8, E1, E3]
            After scoring: [E2(1250), E1(940), E3(530), E5(401), E8(-180)]
            After filtering: [E2(1250), E1(940), E3(530), E5(401)]  ← E8 removed (negative)
            After sorting: [E2, E1, E3, E5]  ← Perfect execution order!

    HOW IT HELPS:
        ✅ ORDERS exploits by success probability (best → worst)
        ✅ FILTERS OUT incompatible exploits (negative OS scores)
        ✅ ADDS scoring info to each exploit (for transparency)
        ✅ READY for execution (just try #1, #2, #3...)

    WHAT IT DOES STEP-BY-STEP:

        Step 1: Score each exploit
            For exploit in [E1, E2, E3]:
                final_score, breakdown = calculate_final_score(exploit)
                exploit["final_score"] = 1250
                exploit["score_breakdown"] = {...}

        Step 2: Filter incompatible (negative scores)
            If os_compatibility < 0: SKIP (Windows on Linux)

        Step 3: Sort by final_score (descending)
            [1250, 940, 530] → [E2, E1, E3]

        Step 4: Return ranked list
            Ready for select_top_exploits()

    REAL IMPACT:
        Before ranking (random order):
            Try E5 (401 pts) → Fails
            Try E8 (-180 pts) → Fails (wrong OS)
            Try E2 (1250 pts) → Success (but wasted 10 min)

        After ranking (ordered):
            Try E2 (1250 pts) → Success immediately! (30 sec)

    WHEN IT'S USED:
        Called by node_3_ranking_selection() to prepare exploits for execution
        Output goes to select_top_exploits() for final selection

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        exploits: List of exploit dictionaries from Node 2
        target_os: Target OS
        target_version: Target version

    Returns:
        List of exploits sorted by final_score (highest first), with score added

    Example:
        Input:  exploits = [
                    {"path": "exploit/A", "rank": "good", "matched_by": "fuzzy", "platform": "unix"},
                    {"path": "exploit/B", "rank": "excellent", "matched_by": "cve", "platform": "unix"},
                    {"path": "exploit/C", "rank": "normal", "matched_by": "service_version", "platform": "windows"}
                ]
                target_os = "Linux 2.6.9"
                target_version = "2.3.4"

        Processing:
            Exploit A: final_score = 400 + 30 + 0 + 100 = 530
            Exploit B: final_score = 1000 + 50 + 100 + 100 = 1250  ← BEST
            Exploit C: final_score = 800 + 20 + 0 - 1000 = -180     ← FILTERED OUT

        Output: [
            {
                "path": "exploit/B",
                "rank": "excellent",
                "matched_by": "cve",
                "platform": "unix",
                "final_score": 1250,  ← Added
                "score_breakdown": {"discovery": 1000, "rank": 50, "version": 100, "os_compatibility": 100}
            },
            {
                "path": "exploit/A",
                "rank": "good",
                "matched_by": "fuzzy",
                "platform": "unix",
                "final_score": 530,
                "score_breakdown": {"discovery": 400, "rank": 30, "version": 0, "os_compatibility": 100}
            }
        ]
        # Exploit C filtered out (negative score from OS incompatibility)

    What it does: Scores each exploit, filters out incompatible ones (negative scores),
                  sorts by score (highest first), returns ranked list.
    """
    ranked = []

    for exploit in exploits:
        # Calculate final score
        final_score, breakdown = calculate_final_score(exploit, target_os, target_version)

        # Filter out incompatible exploits (negative OS score)
        if breakdown["os_compatibility"] < 0:
            continue  # Skip incompatible exploits

        # Add scoring info to exploit
        exploit_with_score = exploit.copy()
        exploit_with_score["final_score"] = final_score
        exploit_with_score["score_breakdown"] = breakdown

        ranked.append(exploit_with_score)

    # Sort by final_score (highest first)
    ranked.sort(key=lambda x: x.get("final_score", 0), reverse=True)

    return ranked


def select_top_exploits(ranked_exploits: List[Dict], max_count: int = 8) -> List[Dict]:
    """
    Select top N exploits for execution.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        We have 15 ranked exploits, but we can't try ALL of them!

        Why not try all?
            ❌ WASTES TIME: 15 exploits × 5 min each = 75 minutes!
            ❌ DIMINISHING RETURNS: Top 8 have 95% success, remaining 7 add only 2%
            ❌ NOISE: Low-ranked exploits clutter results
            ❌ RESOURCE INTENSIVE: Each exploit uses system resources

    SOLUTION:
        Select ONLY the TOP 8 exploits (sweet spot)

        Why exactly 8?
            ✅ HIGH SUCCESS RATE: Top 8 cover 90-95% of success cases
            ✅ FAST EXECUTION: 8 exploits = 10-15 minutes (reasonable time)
            ✅ GOOD VARIETY: Includes CVE, Service, and Fuzzy matches
            ✅ NOT OVERWHELMING: Easy to track and manage
            ✅ BACKUP OPTIONS: If #1 fails, we have #2-8 ready

    HOW IT HELPS:
        ✅ SAVES TIME: 15 min instead of 75 min (5x faster!)
        ✅ FOCUSES effort on BEST exploits (highest success probability)
        ✅ REDUCES noise (only show relevant results)
        ✅ OPTIMAL BALANCE: Not too few (risky), not too many (wasteful)

    REAL EXAMPLE:

        Scenario: 15 exploits ranked by score
            Rank #1: 1250 pts (95% confidence) ← TOP 8
            Rank #2: 940 pts (85% confidence)  ← TOP 8
            Rank #3: 850 pts (80% confidence)  ← TOP 8
            Rank #4: 720 pts (70% confidence)  ← TOP 8
            Rank #5: 580 pts (65% confidence)  ← TOP 8
            Rank #6: 520 pts (60% confidence)  ← TOP 8
            Rank #7: 450 pts (55% confidence)  ← TOP 8
            Rank #8: 380 pts (50% confidence)  ← TOP 8
            Rank #9: 320 pts (45% confidence)  ← SKIP (lower confidence)
            Rank #10-15: <300 pts (<40% confidence) ← SKIP

        Cumulative success probability:
            Try only #1: 95% chance
            Try #1-3: 99% chance (diminishing returns start)
            Try #1-8: 99.7% chance (optimal)
            Try #1-15: 99.9% chance (only +0.2% for 7 more exploits!)

        Decision: TOP 8 gives 99.7% success in 15 min
                  vs ALL 15 gives 99.9% in 75 min
                  → TOP 8 is clearly better!

    WHEN IT'S USED:
        Called by node_3_ranking_selection() after ranking
        Final selection before passing to Node 4 (Exploit Execution)

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        ranked_exploits: List of ranked exploits (sorted by final_score)
        max_count: Maximum number to select (default: 8)

    Returns:
        Top N exploits

    Example:
        Input:  ranked_exploits = [10 exploits sorted by score]
                max_count = 8

        Output: [top 8 exploits]  # Exploits ranked #1 through #8

    WHY 8 EXPLOITS? (from workflow.txt)
        ✅ Better success rate - More attempts = higher chance of success
        ✅ Not too many - Won't waste time trying 15+ exploits
        ✅ Good balance - Enough variety without overwhelming
        ✅ Fast execution - 8 exploits can run in 10-15 minutes
        ✅ Cover different approaches - CVE, Service, Fuzzy all represented

    What it does: Takes the top N exploits from ranked list.
                  Simple slicing: ranked_exploits[:8] = first 8 items
    """
    return ranked_exploits[:max_count]


def calculate_confidence_score(exploit_info: Dict, target_version: str) -> int:
    """
    Calculate confidence percentage for exploit success.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        Users see scores like "1250 points" - what does that MEAN?
        Is 1250 good? Is 530 bad? Hard to understand!

        Example confusion:
            User: "Exploit scored 1250, is that good?"
            Agent: "Yes, very good!"
            User: "How good? 50% chance? 90% chance?"
            Agent: "Uh... high score means... probably works?"

    SOLUTION:
        Convert score to PERCENTAGE that humans understand!
        1250 points → 95% confidence (very likely to work!)
        530 points → 60% confidence (moderate chance)
        50 points → 40% confidence (low chance)

    HOW IT HELPS:
        ✅ USER-FRIENDLY: Everyone understands percentages (95% = very good!)
        ✅ CLEAR EXPECTATIONS: Shows realistic success probability
        ✅ INFORMED DECISIONS: User knows which exploits are most promising
        ✅ PROFESSIONAL: Like weather forecast (80% chance of rain)

    CONFIDENCE CALCULATION:

        Base: 40% (every exploit starts here)

        Bonuses added:
            + Rank bonus (excellent=+20%, great=+15%, good=+10%, normal=+5%)
            + CVE bonus (+15% if found by CVE)
            + Version bonus (+15% exact, +10% close, +5% fuzzy)
            + OS bonus (+10% if compatible)

        Example 1 - HIGH CONFIDENCE:
            Base: 40%
            + Excellent rank: 20%
            + CVE match: 15%
            + Exact version: 15%
            + OS compatible: 10%
            = 100% → Capped at 95% (never 100% certain in hacking!)

        Example 2 - MEDIUM CONFIDENCE:
            Base: 40%
            + Good rank: 10%
            + No CVE: 0%
            + No version match: 0%
            + OS compatible: 10%
            = 60% (moderate chance)

        Example 3 - LOW CONFIDENCE:
            Base: 40%
            + Manual rank: 0%
            + No CVE: 0%
            + No version: 0%
            + OS compatible: 10%
            = 50% (coin flip)

    WHY CAP AT 95%?
        Exploits are NEVER 100% guaranteed!
        Reasons for uncertainty:
            - Unknown patches applied to target
            - Network conditions might interfere
            - Target might have custom configurations
            - Timing issues, firewalls, etc.

        Even "perfect" exploits (CVE + excellent + exact version) can fail.
        95% = "Very confident, but not arrogant"

    REAL USER EXPERIENCE:

        Without confidence scores:
            "Trying exploit/unix/ftp/vsftpd_234_backdoor (1250 points)..."
            User: "Is 1250 good? Should I wait or try something else?"

        With confidence scores:
            "Trying exploit/unix/ftp/vsftpd_234_backdoor (95% confidence)..."
            User: "95%? That's excellent! I'll wait for this to finish."

    WHEN IT'S USED:
        Called by node_3_ranking_selection() for each selected exploit
        Displayed in logs and reports to show success probability

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        exploit_info: Exploit with final_score and score_breakdown
        target_version: Target version

    Returns:
        Confidence percentage (0-100)

    Example 1 - High confidence:
        Input:  exploit_info = {
                    "final_score": 1250,
                    "rank": "excellent",
                    "matched_by": "cve",
                    "score_breakdown": {
                        "version": 100,
                        "os_compatibility": 100
                    }
                }

        Calculation:
            base = 40%
            rank bonus = 20% (excellent)
            CVE bonus = 15%
            version exact = 15%
            OS compatible = 10%
            Total = 40 + 20 + 15 + 15 + 10 = 100%

        Output: 95 (cap at 95% - never 100% certain)

    Example 2 - Medium confidence:
        Input:  exploit_info = {
                    "final_score": 530,
                    "rank": "good",
                    "matched_by": "fuzzy",
                    "score_breakdown": {
                        "version": 0,
                        "os_compatibility": 100
                    }
                }

        Calculation:
            base = 40%
            rank bonus = 10% (good)
            CVE bonus = 0%
            version match = 0%
            OS compatible = 10%
            Total = 40 + 10 + 0 + 0 + 10 = 60%

        Output: 60

    What it does: Estimates success probability based on multiple factors.
                  Higher confidence = more likely to work.
    """
    confidence = 40  # Base confidence

    # Rank bonus (excellent = +20%, great = +15%, good = +10%, normal = +5%)
    rank = exploit_info.get("rank", "").lower()
    rank_bonus = {
        "excellent": 20,
        "great": 15,
        "good": 10,
        "normal": 5,
    }.get(rank, 0)
    confidence += rank_bonus

    # CVE match bonus (found by CVE = +15%)
    if exploit_info.get("matched_by") == "cve":
        confidence += 15

    # Version match bonus
    breakdown = exploit_info.get("score_breakdown", {})
    version_score = breakdown.get("version", 0)
    if version_score >= 100:
        confidence += 15  # Exact version
    elif version_score >= 75:
        confidence += 10  # Close version
    elif version_score >= 25:
        confidence += 5   # Fuzzy version

    # OS compatibility bonus
    os_score = breakdown.get("os_compatibility", 0)
    if os_score >= 100:
        confidence += 10  # Perfect compatibility

    # Cap at 95% (never 100% certain in exploitation)
    return min(confidence, 95)
