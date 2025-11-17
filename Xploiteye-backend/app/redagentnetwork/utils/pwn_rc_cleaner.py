"""
PWN.RC Content Cleaner
Removes markdown formatting and shebangs from GPT-generated pwn.rc files
Produces clean plain Metasploit resource script commands
"""

import re


def clean_pwn_rc_content(raw_content: str) -> str:
    """
    Clean up GPT-generated pwn.rc content by removing markdown formatting and shebangs.

    Steps:
    1. Extract content between <ruby> and </ruby> tags if present
    2. Remove markdown code block markers (```ruby, ```bash, ```, etc.)
    3. Strip leading/trailing whitespace
    4. Remove empty lines at start/end
    5. Remove Ruby shebang (if present) - we use plain Metasploit commands

    Args:
        raw_content: Raw content from GPT response

    Returns:
        Clean plain Metasploit resource script ready for msfconsole execution
    """
    content = raw_content.strip()

    # Step 1: Try to extract content between <ruby> and </ruby> tags
    ruby_match = re.search(r'<ruby>(.*?)</ruby>', content, re.DOTALL)
    if ruby_match:
        content = ruby_match.group(1).strip()

    # Step 2: Remove markdown code block markers
    # Remove opening markers: ```ruby, ```bash, ````
    content = re.sub(r'```[a-z]*\n?', '', content)
    # Remove closing markers: ```
    content = re.sub(r'\n?```\n?', '', content)

    # Step 3: Strip extra whitespace
    content = content.strip()

    # Step 4: Remove completely empty lines at start/end
    lines = content.split('\n')

    # Remove leading empty lines
    while lines and not lines[0].strip():
        lines.pop(0)

    # Remove trailing empty lines
    while lines and not lines[-1].strip():
        lines.pop()

    content = '\n'.join(lines)

    # REMOVE shebang if present (we use plain Metasploit commands, not Ruby)
    if content.startswith('#!/usr/bin/env ruby'):
        content = content.replace('#!/usr/bin/env ruby\n', '', 1)
        content = content.replace('#!/usr/bin/env ruby', '', 1)
        content = content.strip()

    return content


def validate_pwn_rc(content: str) -> tuple:
    """
    Validate that pwn.rc content looks like valid Ruby code.

    Args:
        content: PWN.RC content to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check for markdown artifacts
    if '```' in content:
        return False, "Content contains markdown code blocks (```)"

    # Check for common markdown indicators
    if re.search(r'^#+\s+', content, re.MULTILINE):
        return False, "Content contains markdown headers (#)"

    # Check for <ruby> tags (these should be removed by now)
    if '<ruby>' in content or '</ruby>' in content:
        return False, "Content contains <ruby> tags (should be extracted)"

    # Basic Metasploit syntax check (looking for use, set, exploit commands)
    if not any(keyword in content for keyword in ['use ', 'set ', 'exploit', 'sessions']):
        return False, "Content doesn't look like a valid pwn.rc script (missing use, set, exploit, or sessions commands)"

    return True, ""
