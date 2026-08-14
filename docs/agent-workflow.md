# Shaft agent workflow

This document defines Level 1 of the Shaft Central Command: a shared,
file-based protocol for human direction, Builder, and Reviewer.

It standardizes collaboration and reporting. It does not create automatic
agents, state files, background execution, auto-merge, or deployment.

## 1. Sources of truth

Agents must consult, in this order:

1. `AGENTS.md`, the project constitution;
2. the task and scope approved by human direction;
3. the relevant folder under `docs/agent-reports/missions/`;
4. technical documentation in `README.md`, `docs/`, and source code as needed.

Chat and terminal history may help, but critical technical context and final
decisions must also be recorded in the repository.

## 2. Roles

### Human direction (user + ChatGPT)

- defines product direction and priorities;
- approves the Builder plan and material scope changes;
- decides matters involving architecture, database, authentication, external
  integrations, deployment, destructive migrations, and large refactors;
- analyzes the reports and gives final acceptance.

### Builder

- inspects the existing implementation before proposing changes;
- writes a plan with exact scope and files;
- waits for the required human approval before implementation;
- stays within the approved scope and records any necessary deviation;
- runs validation proportional to the risk;
- saves a complete result report for the Reviewer.

### Reviewer

- begins with a read-only review and does not silently implement fixes;
- checks the approved plan, code diff, tests, regressions, security, edge cases,
  data preservation, and scope compliance;
- distinguishes new findings from pre-existing issues and product decisions;
- classifies findings and gives an explicit verdict;
- records enough evidence for the Builder to reproduce each blocking issue.

## 3. Mission lifecycle

1. **Direction:** human direction defines the objective and constraints.
2. **Investigation:** Builder inspects the current system.
3. **Plan:** Builder records the proposed files, behavior, exclusions, risks,
   and validation.
4. **Approval:** human direction approves or adjusts the plan.
5. **Implementation:** Builder changes only the approved scope.
6. **Validation:** Builder runs the relevant lint, tests, build, and focused
   checks.
7. **Builder handoff:** Builder writes the result report.
8. **Review:** Reviewer independently analyzes the work and writes a verdict.
9. **Correction loop:** if changes are requested, the Builder corrects them and
   the Reviewer reviews again.
10. **Final acceptance:** after Reviewer approval, human direction decides
    whether the mission is complete and whether commit, merge, push, or
    publication is authorized.

No auto-merge is allowed at this level.

## 4. Reviewer classifications and verdicts

Findings use these severities:

- **Critical:** immediate risk of severe data loss, exposure, or broad outage.
- **High:** can cause incorrect writes, security failure, or violation of a
  central acceptance criterion.
- **Medium:** real functional or regression risk under specific conditions.
- **Low:** limited usability, accessibility, maintenance, or presentation risk.
- **Observation:** non-blocking context, pre-existing debt, or future work.

The Reviewer must finish with one verdict:

- **Approved**
- **Approved with non-blocking observations**
- **Changes requested**

Critical, high, and unresolved scope violations normally block approval.
Medium or low findings must state explicitly whether they block the mission.

## 5. Report organization

All reports for the same mission stay together:

```text
docs/agent-reports/
  README.md
  templates/
  missions/
    <mission-id>/
      README.md
      reports...
```

Use a short, stable mission identifier such as
`mission-02-server-route-protection`. The mission `README.md` is its index and
records the objective, scope, chronological documents, current verdict, and
final human decision.

For new documents, prefer chronological names:

- `01-builder-plan-<slug>.md`
- `02-builder-result-<slug>.md`
- `03-reviewer-review-<slug>.md`
- `04-builder-result-<slug>.md`
- `05-reviewer-review-<slug>.md`
- `decision.md`

Existing historical filenames may be preserved when moving them into a mission
folder. Their order must then be made explicit in the mission index.

## 6. Scope changes and blocked work

If implementation reveals a necessary change outside the approved scope, the
Builder must stop that part, describe the evidence and impact, and request a
new human decision. It must not silently expand the mission.

If validation cannot run, the report must state what was attempted, the exact
limitation, what remains unverified, and whether the Builder considers the
result safe to review.

## 7. Completion rule

A mission is complete only when:

- the approved scope is implemented or explicitly waived;
- required validation has passed or its limitation was accepted;
- the Reviewer verdict is Approved or Approved with non-blocking observations;
- human direction records final acceptance;
- any authorized repository or publication action has been completed and
  verified.

Reviewer approval alone does not authorize merge or publication.
