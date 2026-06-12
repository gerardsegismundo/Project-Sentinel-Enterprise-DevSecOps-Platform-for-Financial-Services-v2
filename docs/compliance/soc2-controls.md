# SOC 2 Type II — Control Mapping

## Trust Service Criteria

SOC 2 evaluates five Trust Service Criteria (TSC). Project Sentinel addresses all five with emphasis on Security and Availability.

| Criteria | Status | Coverage |
|----------|--------|----------|
| **Security** (CC) | ✅ Strong | 85% of controls implemented |
| **Availability** (A) | ⚠️ Partial | 60% — DR procedures defined but not tested |
| **Processing Integrity** (PI) | ✅ Strong | Input validation, structured logging |
| **Confidentiality** (C) | ⚠️ Partial | Network isolation done; encryption at rest pending |
| **Privacy** (P) | ⚠️ Partial | Data sanitization implemented; formal policy pending |

---

## Security (Common Criteria)

### CC1 — Control Environment

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC1.1 | COSO Principles | Security policies documented in `security/IMPLEMENTATION.md` |
| CC1.2 | Board/Management Oversight | Compliance mappings in `docs/compliance/` |
| CC1.3 | Organizational Structure | RBAC roles define separation of duties |

### CC2 — Communication and Information

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC2.1 | Internal Communication | README, architecture docs, security implementation guide |
| CC2.2 | External Communication | Incident response and security incident runbooks |

### CC3 — Risk Assessment

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC3.1 | Risk Identification | 7-category security scan (SAST, SCA, secrets, IaC, container, DAST, runtime) |
| CC3.2 | Risk Analysis | Vulnerability severity thresholds in CI (critical fails build) |
| CC3.3 | Fraud Risk | Input validation prevents injection; rate limiting prevents abuse |

### CC5 — Control Activities

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC5.1 | Control Activities | CI/CD pipeline enforces all security checks before deployment |
| CC5.2 | Technology Controls | IaC scanning (Checkov + tfsec), container scanning (Trivy + Grype) |
| CC5.3 | Policies and Procedures | Kyverno admission policies; Pod Security Standards |

### CC6 — Logical and Physical Access Controls

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC6.1 | Logical Access Security | RBAC with 4 role levels; namespace isolation |
| CC6.2 | User Registration/Deregistration | GitHub OIDC for CI/CD; IAM role management via Terraform |
| CC6.3 | Unique Identification | ServiceAccount per workload; GitHub identity for deployments |
| CC6.6 | Restrict Access to System Resources | NetworkPolicies, SecurityContext (non-root, drop ALL, read-only FS) |
| CC6.7 | Restrict Data Movement | Egress limited to DNS/HTTPS; ECR immutable tags prevent image tampering |
| CC6.8 | Prevent Unauthorized Software | Kyverno restricts image registries; container scanning in CI |

### CC7 — System Operations

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC7.1 | Manage System Changes | Git-based change management; PR review required; CI validation |
| CC7.2 | Monitor System Components | Prometheus + Grafana + AlertManager (metrics); Fluent Bit + OpenSearch (logs); Jaeger (traces) |
| CC7.3 | Evaluate Security Events | Falco runtime detection; AlertManager severity routing |
| CC7.4 | Respond to Security Incidents | `runbooks/security-incident.md` — containment, evidence, rotation |
| CC7.5 | Recover from Security Incidents | `runbooks/disaster-recovery.md` — 5 recovery scenarios |

### CC8 — Change Management

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC8.1 | Manage Changes | 17-stage CI/CD pipeline validates every change |
| CC8.2 | Test Changes | Unit tests (25), integration tests, DAST scan before production |
| CC8.3 | Approve Changes | GitHub PR approval + environment protection rules |

### CC9 — Risk Mitigation

| Control | Description | Implementation |
|---------|-------------|----------------|
| CC9.1 | Risk Mitigation | Security hardening: Helmet, CORS, rate limiting, body limits |
| CC9.2 | Vendor Risk Management | Dependency scanning (Snyk/npm audit); pinned image versions |

---

## Availability (A)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| A1.1 | Capacity Management | HPA configured; resource quotas and LimitRange per namespace | ✅ |
| A1.2 | Environmental Protections | Multi-AZ VPC; private subnets for workloads | ✅ |
| A1.3 | Recovery Operations | Helm rollback automation; 5 DR scenarios documented | ⚠️ (untested) |

## Processing Integrity (PI)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| PI1.1 | Processing Accuracy | Input validation (numeric IDs, finite amounts); 400 on bad input | ✅ |
| PI1.2 | Monitor Processing | Structured logging with request ID tracing | ✅ |
| PI1.3 | Processing Error Handling | Custom error handler (`app/src/errors.js`); no stack traces in production | ✅ |

## Confidentiality (C)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| C1.1 | Identify Confidential Information | Account data sanitized before API response | ✅ |
| C1.2 | Protect Confidential Information | ⚠️ NetworkPolicies + RBAC; KMS encryption pending | ⚠️ |

## Privacy (P)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| P1.1 | Notice | ⚠️ Privacy policy not implemented (application-level) | ⚠️ |
| P3.1 | Collection Limitation | API collects only account ID for lookup; no excessive data | ✅ |
| P4.1 | Access to Personal Data | Account data sanitized via `sanitizeAccount()` | ✅ |
| P6.1 | Disposal | Stateless application; no persistent PII storage | ✅ |
