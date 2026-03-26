"""File collection and formatting for agent context."""

import glob
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
MAX_FILE_BYTES = 50_000  # skip files larger than ~50KB

DEFAULT_EXCLUDE = ["node_modules", "__pycache__", ".git", "package-lock.json"]


def collect_files(
        patterns: list[str],
        root: Path = PROJECT_ROOT,
        exclude: Optional[list[str]] = None,
) -> dict[str, str]:
    """Glob file patterns relative to project root.

    Args:
        patterns: Glob patterns relative to project root.
        root: Project root directory.
        exclude: Directory/file names to skip.

    Returns:
        Dict mapping relative file paths to their text content.
    """
    exclude = exclude or DEFAULT_EXCLUDE
    collected: dict[str, str] = {}

    for pattern in patterns:
        for match in sorted(glob.glob(str(root / pattern), recursive=True)):
            path = Path(match)
            rel = path.relative_to(root)

            if any(ex in str(rel) for ex in exclude):
                continue
            if path.stat().st_size > MAX_FILE_BYTES:
                continue
            if not path.is_file():
                continue

            try:
                collected[str(rel)] = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, PermissionError):
                continue

    return collected


def format_file_context(files: dict[str, str]) -> str:
    """Format collected files into an XML context block.

    Args:
        files: Dict mapping relative file paths to their text content.

    Returns:
        XML string wrapping each file in ``<file>`` tags.
    """
    parts = []
    for path, content in files.items():
        parts.append(f'<file path="{path}">\n{content}\n</file>')
    return "<codebase>\n" + "\n\n".join(parts) + "\n</codebase>"
