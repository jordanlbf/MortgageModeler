"""Agent orchestration, CLI argument parsing, and environment checks."""

import sys
import shutil
import argparse
from pathlib import Path

# ── Paths ────────────────────────────────────────────
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

# ── Defaults ─────────────────────────────────────────
DEFAULT_MODEL = "sonnet"


def check_claude_installed() -> None:
    """Verify Claude Code CLI is available."""
    if not shutil.which("claude"):
        print("Error: Claude Code CLI not found.")
        print("  Install: npm install -g @anthropic-ai/claude-code")
        print("  Docs:    https://docs.claude.com/en/docs/claude-code/overview")
        sys.exit(1)


def run_agent(
        agent_name: str,
        file_patterns: list[str],
        extra_context: str = "",
        model: str = DEFAULT_MODEL,
        dry_run: bool = False,
        save: bool = False,
) -> str:
    """Run a named agent: load its prompt, collect files, call Claude Code.

    Args:
        agent_name: Matches the prompt filename (e.g. ``"audit_readme"``).
        file_patterns: Glob patterns relative to project root.
        extra_context: Additional instructions appended to prompt.
        model: Claude model to use (sonnet, opus, haiku).
        dry_run: If True, print file list without calling Claude.
        save: If True, save output to agents/reports/.

    Returns:
        Claude's response text.
    """
    # Lazy imports to avoid circular dependency (_core.claude imports DEFAULT_MODEL from here)
    from _core.files import collect_files, format_file_context
    from _core.claude import call_claude
    from _core.report import save_report

    check_claude_installed()

    prompt_file = PROMPTS_DIR / f"{agent_name}.md"
    if not prompt_file.exists():
        print(f"Error: prompt file not found: {prompt_file}")
        sys.exit(1)

    files = collect_files(file_patterns)
    if not files:
        print(f"No files matched patterns: {file_patterns}")
        sys.exit(1)

    print(f"[scan] {agent_name} -- scanning {len(files)} files...")
    for path in files:
        print(f"    {path}")
    print()

    file_context = format_file_context(files)
    if extra_context:
        file_context += f"\n\n{extra_context}"

    if dry_run:
        print("-- DRY RUN (no Claude call) --")
        print(f"Prompt file:   {prompt_file}")
        print(f"Model:         {model}")
        print(f"Context:       {len(file_context):,} chars ({len(files)} files)")
        return ""

    print(f"[call] claude --model {model}...\n")
    result = call_claude(prompt_file, file_context, model=model)

    print("-" * 60)
    print(result)
    print("-" * 60)

    if save:
        report_path = save_report(agent_name, result)
        print(f"\n[saved] {report_path}")

    return result


def make_parser(description: str) -> argparse.ArgumentParser:
    """Create a standard argument parser for agent scripts.

    Args:
        description: Help text shown when the script is run with ``--help``.

    Returns:
        Configured ``argparse.ArgumentParser`` with common agent flags.
    """
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show which files would be scanned without calling Claude",
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save output to agents/reports/ as a timestamped markdown file",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        choices=["sonnet", "opus", "haiku"],
        help=f"Claude model to use (default: {DEFAULT_MODEL})",
    )
    return parser
