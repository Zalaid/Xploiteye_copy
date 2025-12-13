"""
Document-specific configurations and metadata mappings
"""

DOCUMENT_CONFIGS = {
    "SherlockDroid proposal": {
        "doc_type": "proposal",
        "modules": ["overview", "architecture", "requirements", "literature_review"],
        "content_categories": ["conceptual", "feature_specification", "comparison"],
        "priority_headers": [
            r"^Chapter\s+\d+",
            r"^Epic:",
            r"^Table\s+\d+\.",
        ],
        "keep_together_patterns": [
            r"Title:.*?Priority:.*?Acceptance Criteria:",
            r"Table\s+\d+\..*?(?=\n\n|\Z)",
        ]
    },
    
    "Static Analysis": {
        "doc_type": "technical_implementation",
        "modules": ["static_analysis"],
        "content_categories": ["implementation_detail", "workflow", "architecture"],
        "priority_headers": [
            r"^#{1,3}\s",
            r"^[A-Z][a-z]+\s+[A-Z][a-z]+.*?:",
        ],
        "keep_together_patterns": [
            r"```[\s\S]*?```",
        ]
    },
    
    "Network Scanning": {
        "doc_type": "technical_procedure",
        "modules": ["network_scanning"],
        "content_categories": ["implementation_steps", "procedure"],
        "priority_headers": [
            r"^Phase\s+\d+:",
            r"^Step\s+\d+\.\d+",
        ],
        "keep_together_patterns": []
    },
    
    "frida": {
        "doc_type": "technical_reference",
        "modules": ["dynamic_analysis"],
        "content_categories": ["api_documentation", "implementation_detail"],
        "priority_headers": [
            r"^\d+\s*—",
            r"^[A-Z]\.\s+.*?—",
        ],
        "keep_together_patterns": [
            r"[A-Z]\.\s+.*?—.*?\n.*?Why it matters:.*?(?=\n\n[A-Z]\.|\Z)",
        ]
    },
    
    "C2-Based System Surveillance": {
        "doc_type": "technical_implementation",
        "modules": ["c2_surveillance", "dynamic_analysis"],
        "content_categories": ["implementation_detail", "security_feature"],
        "priority_headers": [
            r"^#{1,3}\s",
        ],
        "keep_together_patterns": []
    }
}

DEFAULT_CONFIG = {
    "doc_type": "technical_documentation",
    "modules": ["general"],
    "content_categories": ["technical"],
    "priority_headers": [r"^#{1,3}\s"],
    "keep_together_patterns": []
}

def get_doc_config(filename):
    """Get configuration for a document based on filename"""
    for key, config in DOCUMENT_CONFIGS.items():
        if key.lower() in filename.lower():
            return config
    return DEFAULT_CONFIG