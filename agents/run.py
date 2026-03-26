#!/usr/bin/env python3
"""
Super agent runner — run one, several, or all agents in parallel.

Usage:
    py agents/run.py readme              # run one agent
    py agents/run.py docstrings frontend # run multiple in parallel
    py agents/run.py all                 # run everything in parallel
    py agents/run.py all --dry-run       # show file lists without calling Claude
    py agents/run.py all --save          # run everything and save reports
    py agents/run.py all --model opus    # run everything with Opus
    py agents/run.py all --sequential    # run one at a time instead of parallel
"""

import sys
import os
import io
import time
import argparse
import threading
import ctypes
from concurrent.futures import ThreadPoolExecutor, as_completed



from registry import discover
from _core.cli import run_agent, DEFAULT_MODEL


def _run_captured(agent_def: dict, model: str, dry_run: bool, save: bool) -> tuple[str, str, bool]:
    """Run a single agent, capturing all stdout/stderr.

    Replaces sys.stdout/stderr with a per-thread StringIO so that
    run_agent prints are captured without interleaving.

    Args:
        agent_def: Agent definition dict from registry.
        model: Claude model to use.
        dry_run: If True, skip the Claude call.
        save: If True, save report to disk.

    Returns:
        Tuple of (short_name, captured output, success bool).
    """
    buf = io.StringIO()
    name = agent_def["short_name"]
    # Save and replace stdout/stderr for this thread only conceptually —
    # in practice sys.stdout is global, so we save/restore around the call.
    old_out, old_err = sys.stdout, sys.stderr
    try:
        sys.stdout = buf
        sys.stderr = buf
        run_agent(
            agent_name=agent_def["name"],
            file_patterns=agent_def["file_patterns"],
            model=model,
            dry_run=dry_run,
            save=save,
        )
        return name, buf.getvalue(), True
    except SystemExit:
        return name, buf.getvalue(), False
    except Exception as exc:
        buf.write(f"\nUnexpected error: {exc}\n")
        return name, buf.getvalue(), False
    finally:
        sys.stdout = old_out
        sys.stderr = old_err


class _ConsoleBoardWin:
    """Write to fixed console rows using the Windows Console API.

    Uses SetConsoleCursorPosition to overwrite specific lines
    without relying on ANSI escape codes.
    """

    def __init__(self, start_row: int, handle: int):
        self._start = start_row
        self._handle = handle

    # Windows console color constants
    _DEFAULT_ATTR = 0x07  # grey on black
    _GREEN_ATTR = 0x0A    # bright green on black
    _RED_ATTR = 0x0C      # bright red on black

    def write_line(self, row: int, text: str, color: int | None = None) -> None:
        """Overwrite a specific row relative to the board start.

        Args:
            row: Zero-based row offset from the board start.
            text: Text to write (padded/truncated to fill the line).
            color: Optional Windows console color attribute.
        """
        class COORD(ctypes.Structure):
            _fields_ = [("X", ctypes.c_short), ("Y", ctypes.c_short)]

        k32 = ctypes.windll.kernel32
        pos = COORD(0, self._start + row)
        k32.SetConsoleCursorPosition(self._handle, pos)

        if color is not None:
            k32.SetConsoleTextAttribute(self._handle, color)

        padded = text.ljust(80)
        written = ctypes.c_ulong()
        k32.WriteConsoleW(self._handle, padded, len(padded), ctypes.byref(written), None)

        # Reset to default
        if color is not None:
            k32.SetConsoleTextAttribute(self._handle, self._DEFAULT_ATTR)


def _get_cursor_row() -> int:
    """Get the current console cursor Y position on Windows.

    Returns:
        Zero-based row number of the cursor.
    """
    class COORD(ctypes.Structure):
        _fields_ = [("X", ctypes.c_short), ("Y", ctypes.c_short)]

    class SMALL_RECT(ctypes.Structure):
        _fields_ = [("Left", ctypes.c_short), ("Top", ctypes.c_short),
                     ("Right", ctypes.c_short), ("Bottom", ctypes.c_short)]

    class CONSOLE_SCREEN_BUFFER_INFO(ctypes.Structure):
        _fields_ = [("dwSize", COORD), ("dwCursorPosition", COORD),
                     ("wAttributes", ctypes.c_ushort), ("srWindow", SMALL_RECT),
                     ("dwMaximumWindowSize", COORD)]

    k32 = ctypes.windll.kernel32
    handle = k32.GetStdHandle(-11)
    info = CONSOLE_SCREEN_BUFFER_INFO()
    k32.GetConsoleScreenBufferInfo(handle, ctypes.byref(info))
    return info.dwCursorPosition.Y


def run_parallel(agent_defs: list[dict], model: str, dry_run: bool, save: bool) -> list[str]:
    """Run multiple agents in parallel with a 4-line live status board.

    Each agent gets a fixed line showing a running timer that updates
    every 500ms. When an agent completes, its line shows COMPLETE
    with the final elapsed time.

    Args:
        agent_defs: List of agent definition dicts.
        model: Claude model to use.
        dry_run: If True, skip Claude calls.
        save: If True, save reports.

    Returns:
        List of agent short names that failed.
    """
    names = [d["short_name"] for d in agent_defs]
    n = len(names)
    max_name = max(len(name) for name in names)
    start_times = {name: time.time() for name in names}
    done: dict[str, tuple[float, bool]] = {}
    results: dict[str, tuple[str, bool]] = {}
    failed: list[str] = []
    lock = threading.Lock()

    real_stdout = sys.stdout

    # Print header
    real_stdout.write(f"\n  Running {n} agents in parallel:\n\n")
    real_stdout.flush()

    # Use Windows Console API for in-place updates, plain fallback otherwise
    use_win_console = os.name == "nt"

    if use_win_console:
        k32 = ctypes.windll.kernel32
        handle = k32.GetStdHandle(-11)
        board_start = _get_cursor_row()

        # Reserve lines by printing blank rows
        for _ in range(n + 1):
            real_stdout.write("\n")
        real_stdout.flush()

        board = _ConsoleBoardWin(board_start, handle)

        def render():
            """Render all agent lines to fixed console positions."""
            with lock:
                for i, name in enumerate(names):
                    padded = name.ljust(max_name)
                    if name in done:
                        elapsed, success = done[name]
                        if success:
                            board.write_line(i, f"  {padded}  ({elapsed:.0f}s)  COMPLETE", board._GREEN_ATTR)
                        else:
                            board.write_line(i, f"  {padded}  ({elapsed:.0f}s)  FAILED", board._RED_ATTR)
                    else:
                        elapsed = time.time() - start_times[name]
                        board.write_line(i, f"  {padded}  ({elapsed:.0f}s)  running...")

        stop_board = threading.Event()

        def updater():
            """Refresh the board every 500ms."""
            while not stop_board.is_set():
                render()
                time.sleep(0.5)

        render()
        update_thread = threading.Thread(target=updater, daemon=True)
        update_thread.start()
    else:
        # Unix/fallback: just print names
        for name in names:
            real_stdout.write(f"    - {name}\n")
        real_stdout.write("\n")
        real_stdout.flush()

    with ThreadPoolExecutor(max_workers=n) as pool:
        futures = {
            pool.submit(_run_captured, defn, model, dry_run, save): defn["short_name"]
            for defn in agent_defs
        }

        for future in as_completed(futures):
            name, output, success = future.result()
            elapsed = time.time() - start_times[name]
            with lock:
                done[name] = (elapsed, success)
            results[name] = (output, success)
            if not success:
                failed.append(name)

            # Fallback for non-Windows
            if not use_win_console:
                padded = name.ljust(max_name)
                status = "COMPLETE" if success else "FAILED"
                real_stdout.write(f"  {padded}  ({elapsed:.0f}s)  {status}\n")
                real_stdout.flush()

    if use_win_console:
        stop_board.set()
        update_thread.join()
        render()  # final render
        # Move cursor below the board
        class COORD(ctypes.Structure):
            _fields_ = [("X", ctypes.c_short), ("Y", ctypes.c_short)]
        pos = COORD(0, board_start + n)
        k32.SetConsoleCursorPosition(handle, pos)

    total = int(time.time() - start_times[names[0]])
    real_stdout.write(f"\n  All {n} agents complete ({total}s)\n")
    real_stdout.flush()

    # Print buffered output in original order
    for name in names:
        output, success = results[name]
        status = "OK" if success else "FAIL"
        print(f"\n{'=' * 60}")
        print(f"  {status}  Agent: {name}")
        print(f"{'=' * 60}\n")
        if output.strip():
            print(output.strip())

    return failed


def run_sequential(agent_defs: list[dict], model: str, dry_run: bool, save: bool) -> list[str]:
    """Run agents one at a time, streaming output live.

    Args:
        agent_defs: List of agent definition dicts.
        model: Claude model to use.
        dry_run: If True, skip Claude calls.
        save: If True, save reports.

    Returns:
        List of agent short names that failed.
    """
    failed: list[str] = []
    for defn in agent_defs:
        name = defn["short_name"]
        print(f"\n{'=' * 60}")
        print(f"  Agent: {name}")
        print(f"{'=' * 60}\n")

        try:
            run_agent(
                agent_name=defn["name"],
                file_patterns=defn["file_patterns"],
                model=model,
                dry_run=dry_run,
                save=save,
            )
        except SystemExit:
            failed.append(name)

    return failed


def main() -> None:
    """Parse CLI args and run the requested agents."""
    agents_map = discover()

    parser = argparse.ArgumentParser(
        description="Run one, several, or all MortgageModeler agents",
    )
    parser.add_argument(
        "agents",
        nargs="+",
        choices=list(agents_map.keys()) + ["all"],
        help="Agent(s) to run, or 'all' to run everything",
    )
    parser.add_argument("--dry-run", action="store_true", help="Pass --dry-run to each agent")
    parser.add_argument("--save", action="store_true", help="Save reports to agents/reports/")
    parser.add_argument("--sequential", action="store_true", help="Run agents one at a time instead of parallel")
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        choices=["sonnet", "opus", "haiku"],
        help=f"Claude model to use (default: {DEFAULT_MODEL})",
    )
    args = parser.parse_args()

    # Resolve which agents to run
    names = list(agents_map.keys()) if "all" in args.agents else args.agents
    agent_defs = [agents_map[n] for n in names]

    # Run
    if args.sequential or len(agent_defs) == 1:
        failed = run_sequential(agent_defs, args.model, args.dry_run, args.save)
    else:
        failed = run_parallel(agent_defs, args.model, args.dry_run, args.save)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"  Finished: {len(agent_defs)} agent(s), {len(failed)} failed")
    if failed:
        print(f"  Failed: {', '.join(failed)}")
    print(f"{'=' * 60}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
