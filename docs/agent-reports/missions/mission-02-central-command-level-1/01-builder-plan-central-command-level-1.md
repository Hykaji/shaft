# Builder plan: Central Command Level 1

**Date:** 2026-08-13  
**Mission:** `mission-02-central-command-level-1`  
**Role:** Builder  
**Status:** Approved by human direction

## Objective

Create a durable, organized protocol for collaboration between Builder and
Reviewer while keeping important decisions under human control.

## Current implementation inspected

- `AGENTS.md` already defined the Shaft purpose, visual direction, general agent
  behavior, code quality, and approval boundaries.
- `docs/agent-reports/` contained ten reports from Mission 1 in one flat folder.
- The reports documented a successful correction loop between Builder and
  Reviewer, but there was no persistent workflow guide, mission index, or report
  template.

## Approved changes

- extend `AGENTS.md` with the formal orchestration contract;
- create `docs/agent-workflow.md`;
- create the report directory guide and three role-specific templates;
- organize historical Mission 1 reports in a dedicated mission folder;
- add mission indexes and update paths affected by the move;
- record this Level 1 implementation as Mission 2.

## Explicit exclusions

- application and visual interface code;
- backend, Notion, database, authentication, and external integrations;
- deployment, publication, push, merge, or auto-merge;
- `.agent/` control files, automatic state transitions, and Lead/Orchestrator
  execution, which belong to future levels.

## Risks and preservation requirements

- preserve every historical report without combining or deleting content;
- keep the chronology and authorship of Builder and Reviewer legible;
- avoid presenting the Builder's own validation as independent review;
- ensure moved-document references do not point to obsolete paths.

## Validation plan

- verify the final file tree and mission indexes;
- search for obsolete report paths;
- validate local Markdown links in the new indexes;
- confirm that changed files are limited to `AGENTS.md` and `docs/`;
- inspect the final Git diff for accidental content loss or unrelated changes.
