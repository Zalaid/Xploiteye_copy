# Xploit Eye - Knowledge Base Directories

This directory structure is for organizing static security knowledge documents.

## Directory Structure

```
knowledge_base/
├── xploiteye_docs/      # Xploit Eye platform documentation
├── owasp/               # OWASP Top 10 and guides
├── cve/                 # CVE descriptions and advisories
├── mitre/               # MITRE ATT&CK techniques
├── remediation/         # Security remediation guides
└── pentest_templates/   # Penetration testing templates
```

## Adding Documents

1. Place PDF files in the appropriate directories
2. Run the initialization script:
   ```bash
   python backend/scripts/init_global_kb.py
   ```

## Supported Formats

- PDF files only
- Documents will be parsed with Docling for structured extraction
- Automatically chunked and embedded into Qdrant

## Examples

- **OWASP**: Place OWASP Top 10 PDFs in `owasp/`
- **CVE**: Place CVE advisory PDFs in `cve/`
- **MITRE**: Place MITRE ATT&CK framework PDFs in `mitre/`
- **Remediation**: Place security fix guides in `remediation/`
