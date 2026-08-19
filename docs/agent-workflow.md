# Shaft agent workflow

This document defines the file-based protocol of the Shaft Central Command for
human direction, Builder, and Reviewer.

It standardizes collaboration, risk levels, and reporting. It does not create
automatic agents, state files, background execution, auto-merge, or deployment.

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

## 3. Execution levels

Every mission is classified before implementation. Classification considers
the worst credible impact, not only the apparent size of the diff.

### Level 1 - light

Use for small, reversible, low-risk changes such as documentation alignment,
copy, isolated presentation adjustments, and maintenance that cannot alter
security, persisted data, external systems, or critical behavior.

- human direction and Builder may be the same agent;
- plan and authorization may be recorded together when the scope is already
  explicit;
- the Builder performs and records a focused self-review;
- human direction still gives final acceptance and separately authorizes Git
  or publication actions.

### Level 2 - supervised

Use for medium-risk product or code changes whose failure could create a real
regression but would not cross a critical boundary.

- the Builder implements the approved scope;
- a separate Reviewer performs an independent review;
- findings follow the standard correction loop;
- human direction gives final acceptance.

### Level 3 - critical

Use whenever work involves database or schema changes, migrations,
authentication, security, personal or financial data, external integrations,
deployment, publication, destructive operations, or major architecture
changes.

- human direction, Builder, and Reviewer remain separate;
- investigation and plan precede implementation;
- material boundaries such as real-data access, remote resource creation,
  migration, cutover, rollback, and publication receive explicit approvals;
- the Reviewer is always independent and cannot be replaced by self-review.

When classification is uncertain, use the higher level. A mission that crosses
a higher-risk boundary must stop that part and be reclassified before work
continues.

## 4. Mission lifecycle

1. **Classification:** direction assigns the execution level and records why.
2. **Direction:** human direction defines the objective and constraints.
3. **Investigation:** Builder inspects the current system.
4. **Plan:** Builder records the proposed files, behavior, exclusions, risks,
   and validation.
5. **Approval:** human direction approves or adjusts the plan.
6. **Implementation:** Builder changes only the approved scope.
7. **Validation:** Builder runs the relevant lint, tests, build, and focused
   checks.
8. **Builder handoff:** Builder writes the result report.
9. **Review:** Level 1 receives a documented self-review; Levels 2 and 3 receive
   an independent Reviewer verdict.
10. **Correction loop:** if changes are requested, the Builder corrects them
    and the applicable review runs again.
11. **Final acceptance:** after the required review, human direction decides
    whether the mission is complete and whether commit, merge, push, or
    publication is authorized.

No auto-merge is allowed at any level.

## 5. Reviewer classifications and verdicts

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

## 6. Report organization

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

## 7. Scope changes and blocked work

If implementation reveals a necessary change outside the approved scope, the
Builder must stop that part, describe the evidence and impact, and request a
new human decision. It must not silently expand the mission.

If validation cannot run, the report must state what was attempted, the exact
limitation, what remains unverified, and whether the Builder considers the
result safe to review.

## 8. Completion rule

A mission is complete only when:

- the approved scope is implemented or explicitly waived;
- required validation has passed or its limitation was accepted;
- the review required by the execution level is Approved or Approved with
  non-blocking observations;
- human direction records final acceptance;
- any authorized repository or publication action has been completed and
  verified.

Reviewer approval alone does not authorize merge or publication.
