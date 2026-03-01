# GitHub Parity Roadmap (Single Source of Truth)

This document is the canonical source of truth for GitTic's current capability versus target GitHub-equivalent behavior. It tracks functional gaps, dependencies, delivery milestones, ticket mappings, and test requirements.

## Scope and parity model

- **Parity baseline**: GitHub.com core workflows for repository collaboration, planning, CI/CD, and enterprise controls.
- **Status scale**:
  - `Green`: broadly parity-complete for target persona.
  - `Amber`: partially implemented; notable UX or API gaps remain.
  - `Red`: foundational capabilities missing.
- **Personas**:
  - **MVP parity**: solo developers and small teams.
  - **Team scale**: multi-team organizations with governance needs.
  - **Enterprise features**: regulated environments, auditability, and scale requirements.

## Domain parity map

| Domain | Current state | Target GitHub-equivalent behavior | Status |
|---|---|---|---|
| Repositories | Core Git hosting and branch management exist. | Full repository lifecycle, protections, templates, forks/mirrors, import/export parity. | Amber |
| PR / Reviews | Pull request basics and issue links exist. | End-to-end review workflows with rules, merge queues, code owners, and review analytics. | Amber |
| Issues / Projects | Issues exist with basic tracking. | Rich issue forms, automation, project views, workflows, and cross-repo planning. | Amber |
| Actions | CI/CD pipelines exist. | GitHub Actions-equivalent workflow syntax, runners, secrets, artifacts, matrices, approvals. | Red |
| Discussions / Wiki | Not a first-class feature set yet. | Community discussions, moderation controls, wiki authoring/versioning/search. | Red |
| Org / Admin / Security | Organizations and security features exist at baseline. | Policy-as-code, SSO/SCIM, audit logs, advanced security insights and controls. | Amber |
| Packages / Releases | Basic release constructs are limited. | Registry support, provenance/SBOM, release orchestration, and package governance. | Red |
| Notifications / Search | Limited notifications and search depth. | Unified inbox, subscriptions, saved searches, advanced code/issue/discussion search. | Red |

---

## 1) Repositories

### Current state
- Repository hosting, cloning, push/pull, and branch operations are supported.
- Baseline permissions and org-level ownership are present.

### Gaps
- Missing branch protection rule engine (required reviewers, status checks, linear history).
- Limited fork network visualization and upstream sync controls.
- Incomplete import/export tooling (GitHub/GitLab migration and metadata fidelity).
- Missing repository templates and starter workflows.

### API/UI dependencies
- API: repository rules endpoints, fork graph endpoints, import/export job APIs.
- UI: repository settings parity pages, branch rules editor, import wizard.

### Data-model prerequisites
- `branch_protection_rules`, `repository_template_metadata`, `repository_import_jobs` tables.
- Event stream entries for repo-level settings changes.

### Measurable acceptance criteria
- p95 latency for evaluating protected-branch rules pre-merge < 150 ms.
- Import job success rate >= 98% for benchmark migration corpus.
- Template repository creation-to-first-commit median time <= 2 minutes.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| Branch protection rules engine | `GT-101` | Unit tests for rule evaluator; integration tests for merge block paths; E2E settings UI tests. |
| Import/export pipeline | `GT-102` | Contract tests for migration adapters; snapshot tests for metadata parity; load test for queue throughput. |
| Repository templates | `GT-103` | E2E "create from template" flows; API schema tests for template metadata. |

---

## 2) PR / Reviews

### Current state
- Pull requests and basic review interactions are available.
- Issue linking and merge operations are supported.

### Gaps
- No code owners enforcement, merge queue, or stacked PR awareness.
- Limited review assignment heuristics and reviewer load balancing.
- Missing draft/ready transitions tied to branch rule automation.

### API/UI dependencies
- API: review rules, code owners resolution service, merge queue APIs.
- UI: multi-file diff performance tuning, review request UX, queue status pane.

### Data-model prerequisites
- `review_rules`, `codeowners_index`, `merge_queue_entries`, `review_load_metrics`.

### Measurable acceptance criteria
- Merge queue throughput >= 200 PRs/hour in synthetic test org.
- Reviewer auto-assignment accuracy >= 85% (historical ownership benchmark).
- Diff rendering p95 <= 1.2s for 2,000-line PRs.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| Code owners + required review rules | `GT-201` | Parser unit tests; integration tests for rule enforcement; branch-protection regression tests. |
| Merge queue | `GT-202` | Queue scheduler simulation tests; chaos tests for failed checks; E2E queue UX tests. |
| Review workload balancing | `GT-203` | Recommendation model offline eval; API contract tests; UX instrumentation checks. |

---

## 3) Issues / Projects

### Current state
- Issue creation and tracking are implemented.
- Basic PR linkage exists.

### Gaps
- Missing issue forms, templates, and automation rules.
- No project-level views (table/board/timeline/roadmap) with custom fields.
- Limited sprint planning and dependency tracking.

### API/UI dependencies
- API: custom fields, project workflows, issue automation webhooks.
- UI: configurable project views, workflow builder, issue forms renderer.

### Data-model prerequisites
- `issue_templates`, `project_custom_fields`, `project_workflow_rules`, `issue_dependencies`.

### Measurable acceptance criteria
- Project board actions complete in <= 300 ms p95.
- Workflow automations process within <= 10 seconds p95.
- Issue form validation catches >= 95% invalid submissions in test suite.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| Issue forms + templates | `GT-301` | Form schema validation tests; E2E issue creation from templates. |
| Projects v2-style views | `GT-302` | UI regression tests for table/board/timeline; API pagination tests. |
| Workflow automations | `GT-303` | Event-driven integration tests; retry/idempotency tests; latency SLO checks. |

---

## 4) Actions

### Current state
- Existing CI/CD pipelines provide baseline automation.

### Gaps
- No native GitHub Actions workflow compatibility layer.
- Incomplete secrets/variables scoping and OIDC workload identity.
- Missing hosted runner management and matrix execution parity.

### API/UI dependencies
- API: workflow parser/executor APIs, runner registration, artifact storage API.
- UI: workflow visualizer, run logs, re-run controls, secrets manager UX.

### Data-model prerequisites
- `workflow_definitions`, `workflow_runs`, `runner_pools`, `workflow_artifacts`, `secret_scopes`.

### Measurable acceptance criteria
- Workflow start latency <= 20s p95 for shared runners.
- Matrix fan-out reliability >= 99.5% successful job scheduling.
- Artifact upload/download success >= 99.9%.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| Actions-compatible workflow engine | `GT-401` | YAML parser conformance tests; execution integration tests; sandbox security tests. |
| Runner fleet management | `GT-402` | Autoscaling tests; failover tests; cost/performance benchmark suite. |
| Secrets + OIDC | `GT-403` | Access control tests; key rotation tests; OIDC audience/claims validation tests. |

---

## 5) Discussions / Wiki

### Current state
- Feature set is not yet productized.

### Gaps
- Missing threaded discussions, moderation tooling, and category controls.
- No wiki creation, permissions model, or page history diff UX.

### API/UI dependencies
- API: discussions CRUD/moderation endpoints, wiki page versioning APIs.
- UI: discussion thread views, moderation queue, wiki editor/search.

### Data-model prerequisites
- `discussion_threads`, `discussion_posts`, `moderation_actions`, `wiki_pages`, `wiki_revisions`.

### Measurable acceptance criteria
- Discussion page load <= 1s p95 for 500-comment threads.
- Moderation action propagation <= 5s p95.
- Wiki revision restore operation success >= 99.9%.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| Discussions MVP | `GT-501` | API CRUD tests; abuse/moderation integration tests; accessibility tests for thread navigation. |
| Wiki versioning + editor | `GT-502` | Revision diff unit tests; E2E restore/rollback scenarios. |

---

## 6) Org / Admin / Security

### Current state
- Organizations and baseline security controls are available.

### Gaps
- Limited enterprise identity (SSO/SCIM), policy controls, and delegated administration.
- Incomplete audit log coverage and security alert workflow depth.

### API/UI dependencies
- API: SCIM provisioning, SAML/OIDC admin controls, audit stream export.
- UI: org policy center, role delegation screens, audit explorer.

### Data-model prerequisites
- `org_policies`, `org_role_bindings`, `audit_log_events`, `security_alert_workflows`.

### Measurable acceptance criteria
- SCIM sync drift <= 0.5% daily.
- Audit log ingestion and query availability <= 60s p95.
- High-severity security alerts triaged within SLA in >= 95% test simulations.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| SSO/SCIM + identity governance | `GT-601` | SCIM conformance tests; SSO login E2E tests; role escalation negative tests. |
| Audit log + policy center | `GT-602` | Event schema contract tests; retention tests; query performance tests. |
| Security alert workflows | `GT-603` | Rule engine tests; notification delivery tests; incident drill simulations. |

---

## 7) Packages / Releases

### Current state
- Release and package capabilities are limited and fragmented.

### Gaps
- Missing first-party multi-ecosystem package registry support.
- Incomplete release pipelines (notes generation, signed assets, provenance).
- No lifecycle and retention policies for package governance.

### API/UI dependencies
- API: package publish/install endpoints, provenance/SBOM APIs, release orchestration APIs.
- UI: package registry UI, release drafting/publishing flows, vulnerability indicators.

### Data-model prerequisites
- `package_namespaces`, `package_versions`, `release_assets`, `sbom_documents`, `provenance_attestations`.

### Measurable acceptance criteria
- Package publish success >= 99.9% for supported ecosystems.
- Release asset CDN availability >= 99.95%.
- Provenance verification pass rate >= 99% for signed release pipeline.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| Package registry core | `GT-701` | Publish/install contract tests; authz tests; scale/load tests. |
| Release management + signing | `GT-702` | Artifact signing verification tests; E2E release flow tests; rollback tests. |
| SBOM + provenance | `GT-703` | Schema validation tests; provenance policy enforcement tests. |

---

## 8) Notifications / Search

### Current state
- Notification and search capabilities exist in limited form.

### Gaps
- Missing unified inbox with granular subscriptions.
- Search lacks advanced syntax, ranking controls, and cross-domain relevance.
- No saved searches or alerting from search queries.

### API/UI dependencies
- API: notification preferences/stream API, full-text indexing/query APIs.
- UI: inbox triage workflow, subscription controls, advanced search builder.

### Data-model prerequisites
- `notification_subscriptions`, `notification_events`, `search_indices`, `saved_searches`.

### Measurable acceptance criteria
- Notification delivery latency <= 5s p95.
- Search query p95 <= 500ms for top 95% query classes.
- Relevance score NDCG@10 improves by >= 20% over baseline benchmark.

### Implementation tickets & tests
| Item | Ticket | Test requirements |
|---|---|---|
| Unified notifications inbox | `GT-801` | End-to-end notification routing tests; preference persistence tests; UX acceptance tests. |
| Advanced search + ranking | `GT-802` | Query parser tests; ranking evaluation suite; index freshness tests. |
| Saved searches + alerts | `GT-803` | Scheduler tests; deduplication tests; opt-out compliance tests. |

---

## Phased milestones, owners, and target dates

| Milestone | Target date | Owner | Goal | Exit criteria |
|---|---|---|---|---|
| **MVP parity** | 2026-06-30 | Platform PM + Repos/PR engineering leads | Deliver core solo/small-team parity across repositories, PRs, issues, and baseline actions. | `GT-101..303` and `GT-401` launched; parity scorecard >= 70%; critical Sev-1 defects = 0 for 30 days. |
| **Team scale** | 2026-11-30 | Product Director + Collaboration/Actions leads | Enable multi-team planning, robust CI scaling, and dependable notifications/search. | `GT-402..403`, `GT-302..303`, `GT-801..802` complete; p95 performance SLOs met for 3 consecutive releases. |
| **Enterprise features** | 2027-04-30 | VP Engineering + Security/Admin leads | Provide enterprise identity, governance, package integrity, and auditability. | `GT-601..703`, `GT-803` complete; compliance readiness checklist passed; audit coverage >= 95%. |

## Ticket and test traceability matrix

| Roadmap item | Ticket(s) | Required test suites | Release gate |
|---|---|---|---|
| Repositories parity | `GT-101`, `GT-102`, `GT-103` | Unit + integration + E2E + migration load tests | Branch protection + import reliability SLOs met |
| PR/reviews parity | `GT-201`, `GT-202`, `GT-203` | Parser/unit + queue simulation + E2E UX + performance tests | Merge queue and review latency SLOs met |
| Issues/projects parity | `GT-301`, `GT-302`, `GT-303` | Schema/unit + workflow integration + UI regression tests | Automation latency + data integrity checks pass |
| Actions parity | `GT-401`, `GT-402`, `GT-403` | Conformance + security + autoscaling + reliability tests | Workflow start/runner reliability SLOs met |
| Discussions/wiki parity | `GT-501`, `GT-502` | CRUD/API + moderation + accessibility + revision tests | Accessibility and moderation SLAs pass |
| Org/admin/security parity | `GT-601`, `GT-602`, `GT-603` | Identity conformance + audit schema + incident simulation tests | Audit + identity controls verified |
| Packages/releases parity | `GT-701`, `GT-702`, `GT-703` | Contract + signing + provenance + load tests | Supply-chain integrity gates pass |
| Notifications/search parity | `GT-801`, `GT-802`, `GT-803` | Routing + ranking + scheduler + compliance tests | Notification and search SLOs met |

## Release checklist (applies to every parity milestone)

### UX polish
- [ ] Consistent empty states, loading states, and error-recovery patterns.
- [ ] Keyboard shortcuts and power-user flows documented and discoverable.
- [ ] In-product help links and migration hints for legacy workflows.

### Accessibility
- [ ] WCAG 2.2 AA audit completed for all newly shipped surfaces.
- [ ] Keyboard-only navigation verified (tab order, focus rings, escape paths).
- [ ] Screen-reader smoke tests executed for critical flows (repo, PR, issue, actions).

### Performance
- [ ] Domain-specific p95 latency SLOs validated in pre-prod and production canary.
- [ ] Front-end bundle and interaction metrics (LCP/INP) within budget.
- [ ] Back-end saturation and queue-depth alarms tested under peak synthetic load.

### Observability
- [ ] Structured logs, metrics, and distributed traces emitted for new flows.
- [ ] SLO dashboards and alerts are live with owner rotation documented.
- [ ] Runbooks updated with rollback, mitigation, and escalation procedures.
