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