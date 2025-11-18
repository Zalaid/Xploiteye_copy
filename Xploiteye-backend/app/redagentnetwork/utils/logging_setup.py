"""
Logging Setup
Configures logging to session directory
"""

import logging
import os
from pathlib import Path
from typing import Optional


def setup_logger(
    log_file: str,
    log_level: str = None,
    logger_name: str = "red_agent"
) -> logging.Logger:
    """
    Setup logger that writes to session directory.

    Args:
        log_file: Full path to log file (from state["log_file"])
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        logger_name: Name of the logger

    Returns:
        Configured logger instance

    Example:
        logger = setup_logger(state["log_file"])
        logger.info("Starting exploitation...")
    """

    # Disable verbose third-party logging
    logging.getLogger("langsmith").setLevel(logging.WARNING)
    logging.getLogger("langchain").setLevel(logging.WARNING)

    # Get log level from environment or parameter
    if log_level is None:
        log_level = os.getenv("LOG_LEVEL", "INFO")

    # Convert string log level to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Create logger
    logger = logging.getLogger(logger_name)
    logger.setLevel(numeric_level)
    logger.propagate = False  # Don't propagate to parent loggers to avoid duplicates

    # Clear existing handlers to avoid duplicates
    logger.handlers.clear()

    # Get log format from environment
    log_format = os.getenv(
        "LOG_FORMAT",
        "[%(asctime)s] [%(levelname)s] %(message)s"
    )

    # Create formatter
    formatter = logging.Formatter(log_format)

    # File handler - writes to session directory
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(numeric_level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Console handler - prints to terminal so you can see logs in real-time
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger


def log_node_start(logger: logging.Logger, node_name: str, node_number: int):
    """
    Log the start of a node with a separator.

    Args:
        logger: Logger instance
        node_name: Name of the node
        node_number: Node number
    """
    separator = "=" * 70
    logger.info(separator)
    logger.info(f"NODE {node_number}: {node_name}")
    logger.info(separator)


def log_node_end(logger: logging.Logger, node_name: str, success: bool):
    """
    Log the end of a node.

    Args:
        logger: Logger instance
        node_name: Name of the node
        success: Whether the node succeeded
    """
    status = "✅ SUCCESS" if success else "❌ FAILED"
    logger.info(f"{node_name} - {status}")
    logger.info("=" * 70)
    logger.info("")


def log_check(logger: logging.Logger, check_name: str, status: bool, details: str = ""):
    """
    Log a validation check result.

    Args:
        logger: Logger instance
        check_name: Name of the check
        status: Check result (True/False)
        details: Additional details
    """
    icon = "✅" if status else "❌"
    message = f"{icon} {check_name}"
    if details:
        message += f" - {details}"

    if status:
        logger.info(message)
    else:
        logger.error(message)
