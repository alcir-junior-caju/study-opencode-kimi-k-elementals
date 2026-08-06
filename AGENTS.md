# OpenCode Instructions

- **Write Guardrails**: Agents may only write to paths inside the repository root tree (`./`, `./src`, etc.). Any attempt to write outside these directories should be aborted.

The repository currently contains no code or scripts. At this time there are no build, test, lint, or other commands to run.
Once the project grows, add executable entry points (e.g., `npm`, `pnpm`, `go install`, `make`) and update this file accordingly.

- **Document Repository**: The `docs/` directory serves as a central location for documents that agents can consult on demand. All artifacts are written in English.
