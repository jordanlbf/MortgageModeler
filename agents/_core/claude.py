"""Claude Code CLI invocation with progress spinner."""

import sys
import shutil
import subprocess
import threading
import time
import itertools
from pathlib import Path

from _core.cli import DEFAULT_MODEL


def call_claude(
        prompt_file: Path,
        file_context: str,
        model: str = DEFAULT_MODEL,
) -> str:
    """Call Claude Code CLI in one-shot mode with a progress spinner.

    Reads the system prompt file, passes it via ``--system-prompt``,
    and pipes file contents through stdin.

    Args:
        prompt_file: Path to the system prompt markdown file.
        file_context: Codebase context string to pipe via stdin.
        model: Claude model to use.

    Returns:
        Claude's full response text.

    Raises:
        SystemExit: If Claude Code returns a non-zero exit code.
    """
    claude_bin = shutil.which("claude")
    if not claude_bin:
        print("Error: Claude Code CLI not found on PATH.")
        sys.exit(1)

    system_prompt = prompt_file.read_text(encoding="utf-8")

    cmd = [
        claude_bin,
        "-p", "Analyse the codebase provided via stdin and produce the report described in your system prompt.",
        "--system-prompt", system_prompt,
        "--model", model,
        "--output-format", "text",
    ]

    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )

    stop_spinner = threading.Event()
    start_time = time.time()

    def spinner():
        """Display a progress spinner until stop_spinner is set."""
        phases = itertools.cycle(["|", "/", "-", "\\"])
        while not stop_spinner.is_set():
            elapsed = int(time.time() - start_time)
            print(f"\r  {next(phases)}  Thinking... ({elapsed}s)", end="", flush=True)
            time.sleep(0.1)
        elapsed = int(time.time() - start_time)
        print(f"\r  Done ({elapsed}s)" + " " * 20)

    spin_thread = threading.Thread(target=spinner, daemon=True)
    spin_thread.start()

    stdout, stderr = process.communicate(input=file_context)

    stop_spinner.set()
    spin_thread.join()

    if process.returncode != 0:
        print(f"\nError: Claude Code exited with code {process.returncode}")
        if stderr.strip():
            print(f"  {stderr.strip()}")
        sys.exit(1)

    return stdout.strip()
