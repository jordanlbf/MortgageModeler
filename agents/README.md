# Agents

AI-powered code review workflows. Each agent scans specific parts of the codebase and produces actionable recommendations using Claude Code CLI.

## Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) installed:
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- A Claude Pro or Max subscription

## Available Agents

| Agent | Short name | What it does |
|-------|-----------|--------------|
| **Audit README** | `readme` | Compares `README.md` against actual codebase structure, endpoints, tech stack, and test counts |
| **Audit Docstrings** | `docstrings` | Checks Python (Google style) and TypeScript (JSDoc) documentation coverage |
| **Lean Frontend** | `frontend` | Flags thick components with too much logic and suggests hook/utility extractions |
| **Architecture Guard** | `architecture` | Checks for layer violations across the backend and frontend stack |
| **Tax Compliance** | `tax` | Validates tax engine against documented ATO rules, thresholds, and test coverage |
| **Stamp Duty Compliance** | `stamp_duty` | Validates multi-state stamp duty brackets, engine logic, and test coverage |
| **Grants Compliance** | `grants` | Validates grant scheme config, eligibility predicates, and financial effects |

## Usage

All commands run from the project root:

```bash
py agents/run.py readme              # run one agent
py agents/run.py docstrings frontend # run multiple in parallel
py agents/run.py all                 # run everything in parallel
py agents/run.py all --sequential    # run one at a time
py agents/run.py all --save          # save reports to agents/reports/
py agents/run.py all --model opus    # use Opus for deeper analysis
py agents/run.py all --dry-run       # show which files would be scanned
```

## How it works

1. `run.py` discovers available agents from `defs/*.toml` via `registry.py`
2. Each `.toml` file defines the agent's name, file patterns, and description
3. `_core/` collects matching files, pipes them to `claude -p` with the system prompt from `prompts/`
4. Claude analyses the codebase and produces a structured report

## Adding a new agent

1. Create `defs/my_agent.toml`:
   ```toml
   name = "my_agent"
   short_name = "mine"
   description = "What this agent does"
   file_patterns = [
       "backend/**/*.py",
   ]
   ```
2. Create `prompts/my_agent.md` with the system prompt
3. Run it: `py agents/run.py mine`

No Python files to edit — the registry auto-discovers new TOML definitions.

## Directory structure

```
agents/
├── README.md              # This file
├── run.py                 # CLI entry point — run one, several, or all agents
├── registry.py            # Auto-discovers agent definitions from defs/*.toml
├── _core/                 # Internal infrastructure package
│   ├── __init__.py        # Re-exports public API
│   ├── cli.py             # run_agent orchestrator, make_parser, env checks
│   ├── claude.py          # Claude Code CLI invocation + spinner
│   ├── files.py           # File collection and XML formatting
│   └── report.py          # Report saving
├── defs/                  # Agent definitions (one TOML per agent)
│   ├── audit_readme.toml
│   ├── audit_docstrings.toml
│   ├── lean_frontend.toml
│   ├── architecture_guard.toml
│   ├── tax_compliance.toml
│   ├── stamp_duty_compliance.toml
│   └── grants_compliance.toml
├── prompts/               # System prompts (one MD per agent)
│   ├── audit_readme.md
│   ├── audit_docstrings.md
│   ├── lean_frontend.md
│   ├── architecture_guard.md
│   ├── tax_compliance.md
│   ├── stamp_duty_compliance.md
│   └── grants_compliance.md
└── reports/               # Generated reports via --save (gitignored)
```
