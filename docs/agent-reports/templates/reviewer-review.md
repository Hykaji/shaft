# Reviewer review: <mission title>

**Date:** YYYY-MM-DD  
**Mission:** `<mission-id>`  
**Role:** Reviewer  
**Builder result reviewed:** `<relative-path>`  
**Review type:** Read-only

## Verdict

Choose exactly one:

- Approved
- Approved with non-blocking observations
- Changes requested

## Scope and evidence reviewed

List the approved plan, Builder result, diff, source files, tests, build output,
and other evidence independently inspected.

## Executive assessment

State whether the objective was met, scope was respected, and important
behavior was preserved.

## Findings

For each finding include:

### [Severity] Short title

- **Evidence:** file, line, command, or reproducible behavior.
- **Impact:** concrete user, data, security, or maintenance consequence.
- **Required action:** what must change, or why the finding is non-blocking.

Use Critical, High, Medium, Low, or Observation.

## Validation assessment

Record what the Reviewer reproduced, what remains unverified, and why.

## Final handoff

If changes are requested, return the work to the Builder with explicit blocking
items. If approved, state that merge or publication still requires final human
acceptance.
