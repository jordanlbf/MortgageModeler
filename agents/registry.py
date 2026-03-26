"""Agent registry — auto-discovers agent definitions from defs/*.toml."""

import tomllib
from pathlib import Path

DEFS_DIR = Path(__file__).resolve().parent / "defs"


def load_agent(name: str) -> dict:
    """Load a single agent definition by its TOML filename.

    Args:
        name: TOML filename stem (e.g. ``"audit_readme"``).

    Returns:
        Parsed agent definition dict.

    Raises:
        FileNotFoundError: If the definition file does not exist.
    """
    path = DEFS_DIR / f"{name}.toml"
    with open(path, "rb") as f:
        return tomllib.load(f)


def discover() -> dict[str, dict]:
    """Auto-discover all agents from defs/*.toml.

    Returns:
        Dict mapping short names to agent definition dicts.
    """
    agents: dict[str, dict] = {}
    for f in sorted(DEFS_DIR.glob("*.toml")):
        with open(f, "rb") as fh:
            defn = tomllib.load(fh)
        agents[defn["short_name"]] = defn
    return agents
