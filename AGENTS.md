# Shaft — Agent Instructions

## Project overview

Shaft is a personal productivity and life organization application.

The project is intended to centralize areas such as:
- Tasks
- Personal organization
- Studies
- Courses
- Projects
- Notes
- Goals
- Habits
- Planning
- Personal dashboards

The project is still evolving, so agents should avoid making major architectural changes without first explaining the proposed change.

## Visual identity

Primary visual direction:
- Black background
- Lobster red as the main accent color
- Minimalist interface
- Dark aesthetic
- Clean layouts
- Modern and slightly futuristic visual language

Avoid introducing unrelated colors or visual styles without approval.

## Agent behavior

Before making changes:

1. Inspect the existing project structure.
2. Understand the current implementation.
3. Explain major changes before executing them.
4. Prefer modifying existing systems instead of rebuilding them unnecessarily.
5. Avoid deleting working functionality unless explicitly requested.
6. Preserve existing data, integrations and configurations whenever possible.
7. Keep changes organized and easy to review.

## Code quality

Agents should:
- Prefer readable code over overly clever implementations.
- Reuse existing components when possible.
- Avoid unnecessary dependencies.
- Keep files reasonably organized.
- Document important architectural decisions.
- Check for regressions after meaningful changes.

## Project context

This file is the main persistent technical context for AI coding agents working on Shaft.

More detailed technical documentation may be stored in:

- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/decisions/`
- `README.md`

Agents should consult these files when relevant.

## Human approval

For major changes involving:
- Architecture
- Database structure
- Authentication
- External integrations
- Deployment
- Destructive migrations
- Large refactors

Explain the change first and wait for approval before proceeding.

## Agent orchestration

`AGENTS.md` is the constitution for all coding agents working on Shaft. The
detailed Level 1 workflow is defined in `docs/agent-workflow.md`.

The standard roles are:

- **Human direction (user + ChatGPT):** defines priorities, approves scope and
  important decisions, and gives final acceptance.
- **Builder:** investigates, proposes a plan, implements only the approved
  scope, validates the result, and writes a complete handoff report.
- **Reviewer:** starts read-only, independently reviews the implementation and
  Builder report, classifies findings, and issues a verdict.

For every mission, agents must:

1. Read this file, `docs/agent-workflow.md`, and the relevant mission folder.
2. Store plans, implementation reports, reviews, and final decisions together
   under `docs/agent-reports/missions/<mission-id>/`.
3. Use the templates in `docs/agent-reports/templates/` for new reports.
4. Keep reports chronological and link each handoff to the document it reviews
   or supersedes.
5. Preserve the distinction between observed evidence, assumptions, risks, and
   human decisions.

The normal handoff is Builder -> Reviewer -> human direction. If the Reviewer
requests changes, the work returns to the Builder and is reviewed again.

Do not auto-merge. Do not commit, merge, push, or publish a mission as complete
until the Reviewer has approved it and human direction has given final
acceptance. A local checkpoint commit may be made only when explicitly
authorized and must not be represented as final acceptance.
