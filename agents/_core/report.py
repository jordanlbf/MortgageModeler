"""Report saving for agent output."""

from datetime import datetime
from pathlib import Path

REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"


def save_report(agent_name: str, content: str) -> Path:
    """Save a report to agents/reports/ with a timestamped filename.

    Args:
        agent_name: Name used as the filename prefix.
        content: Report text to write.

    Returns:
        Path to the saved report file.
    """
    REPORTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%d-%m-%Y_%H-%M-%S")
    filename = f"{agent_name}_{timestamp}.md"
    report_path = REPORTS_DIR / filename
    report_path.write_text(content, encoding="utf-8")
    return report_path
