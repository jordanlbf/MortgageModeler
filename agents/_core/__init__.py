"""Core agent infrastructure — re-exports the public API."""

from _core.files import collect_files, format_file_context, MAX_FILE_BYTES
from _core.claude import call_claude
from _core.report import save_report
from _core.cli import run_agent, make_parser, check_claude_installed, DEFAULT_MODEL

__all__ = [
    "collect_files",
    "format_file_context",
    "MAX_FILE_BYTES",
    "call_claude",
    "save_report",
    "run_agent",
    "make_parser",
    "check_claude_installed",
    "DEFAULT_MODEL",
]
