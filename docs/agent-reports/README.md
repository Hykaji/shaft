# Shaft agent reports

This directory is the durable handoff history for the Shaft Central Command.
Builder and Reviewer reports remain together by mission so a future agent can
reconstruct the complete decision cycle without relying on chat or terminal
scrollback.

## Structure

- `missions/`: one folder per mission, containing its index and chronological
  reports;
- `templates/`: standard starting points for Builder plans, Builder results,
  and Reviewer reviews.

## Missions

- [`mission-01-notion-fallback`](missions/mission-01-notion-fallback/README.md):
  complete, approved, and committed locally.
- [`mission-02-central-command-level-1`](missions/mission-02-central-command-level-1/README.md):
  accepted after Reviewer approval; local commit authorized.
- [`mission-03-notion-route-protection`](missions/mission-03-notion-route-protection/README.md):
  accepted after independent review; local commit authorized.

## Rules

1. Create or select the mission folder before writing a report.
2. Read its `README.md` and all documents relevant to the current handoff.
3. Keep Builder and Reviewer documents in the same mission folder.
4. Add every new document to the mission index in chronological order.
5. Link a result to its approved plan and a review to the result it evaluates.
6. Never overwrite a prior report to hide history; add a new report that
   supersedes it.
7. Keep evidence, assumptions, exclusions, risks, and decisions explicit.
8. Do not store secrets, tokens, personal credentials, or `.env` contents here.

The operating protocol and completion criteria are defined in
`docs/agent-workflow.md`.
