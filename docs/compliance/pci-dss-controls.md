# PCI-DSS v4.0 — Control Mapping

## Applicability
Project Sentinel handles simulated financial transaction data. This mapping documents controls relevant to a banking/payment processing platform.

## Summary

| Requirement | Description | Status |
|-------------|-------------|--------|
| 1 | Network Security Controls | ✅ Implemented |
| 2 | Secure Configurations | ✅ Implemented |
| 3 | Protect Stored Account Data | ⚠️ Partial |
| 4 | Protect Data in Transit | ⚠️ Partial |
| 5 | Protect Against Malware | ✅ Implemented |
| 6 | Develop Secure Systems | ✅ Implemented |
| 7 | Restrict Access | ✅ Implemented |
| 8 | Identify Users and Authenticate | ⚠️ Partial |
| 9 | Restrict Physical Access | N/A (Cloud) |
| 10 | Log and Monitor | ✅ Implemented |
| 11 | Test Security Regularly | ✅ Implemented |
| 12 | Organizational Policies | ⚠️ Partial |

---

## Detailed Control Mapping

### Requirement 1: Install and Maintain Network Security Controls

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 1.2.1 — Restrict inbound/outbound traffic | VPC with public/private subnets; NAT gateway for egress | `terraform/modules/vpc/main.tf` |
| 1.2.5 — Restrict all services and ports | Kubernetes NetworkPolicies restrict pod-to-pod traffic | `security/network-policies/network-policies.yaml` |
| 1.3.1 — Restrict inbound to CDE | Banking namespace isolated with default-deny NetworkPolicy | `security/network-policies/network-policies.yaml` |
| 1.3.2 — Restrict outbound from CDE | Egress limited to DNS (53), HTTPS (443), HTTP (80) | Same NetworkPolicy file |
| 1.4.1 — Implement controls between trusted/untrusted | ALB in public subnet; EKS in private subnets | `terraform/modules/vpc/main.tf`, `terraform/modules/eks/main.tf` |

### Requirement 2: Apply Secure Configurations

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 2.2.1 — Configuration standards for all components | Terraform modules enforce consistent config | `terraform/modules/` |
| 2.2.2 — Manage vendor default accounts | Grafana admin password managed via Secrets Manager | `ansible/roles/secrets-manager/` |
| 2.2.7 — Encrypt non-console admin access | EKS API uses TLS; kubectl over HTTPS | EKS managed |

### Requirement 3: Protect Stored Account Data

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 3.4.1 — Render PAN unreadable | Application does not store raw PAN; account data sanitized | `app/src/accounts.js` — `sanitizeAccount()` |
| 3.5.1 — Protect cryptographic keys | ⚠️ KMS integration planned; currently uses env vars | Tracked in remediation plan |

### Requirement 4: Protect Data in Transit

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 4.2.1 — Strong cryptography for transmission | ⚠️ TLS termination at ALB planned; internal cluster traffic unencrypted | Ingress TLS to be configured |

### Requirement 5: Protect Against Malicious Software

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 5.2.1 — Anti-malware on systems | Container image scanning (Trivy + Grype) in CI/CD | `.github/workflows/ci-cd.yml` |
| 5.2.2 — Detect and address malware | Falco runtime security for container anomaly detection | `ansible/roles/security-hardening/` |
| 5.3.1 — Anti-malware mechanisms are active | Scanning runs on every pipeline execution | CI/CD pipeline |

### Requirement 6: Develop and Maintain Secure Systems

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 6.2.1 — Secure development practices | SAST (Semgrep + SonarQube), secret scanning (TruffleHog) | `.github/workflows/ci-cd.yml` |
| 6.2.2 — Software development personnel trained | Security implementation docs provided | `security/IMPLEMENTATION.md` |
| 6.3.1 — Security vulnerabilities identified and addressed | Dependency scanning (Snyk), IaC scanning (Checkov + tfsec) | CI pipeline |
| 6.4.1 — Public-facing web apps protected | DAST via OWASP ZAP; input validation, rate limiting, Helmet headers | `app/src/middleware.js`, CI pipeline |
| 6.5.1 — Address common coding vulnerabilities | Semgrep OWASP Top 10 ruleset; validated input, parameterized queries | CI pipeline |

### Requirement 7: Restrict Access to System Components

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 7.1.1 — Access control policies defined | RBAC with least-privilege roles | `security/rbac/rbac-policies.yaml` |
| 7.2.1 — Access based on job responsibilities | 4 roles: app, deployer, developer, security-auditor | Same file |
| 7.2.2 — Accounts assigned based on classification | ServiceAccount per workload; no shared accounts | Helm chart, RBAC |

### Requirement 8: Identify Users and Authenticate Access

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 8.2.1 — Unique IDs for all users | GitHub OIDC for CI/CD; named K8s RBAC groups | `terraform/modules/iam/main.tf` |
| 8.3.1 — MFA for administrative access | ⚠️ AWS IAM MFA enforced; K8s RBAC via OIDC (no K8s-level MFA) | AWS IAM |
| 8.6.1 — Application/system accounts managed | ⚠️ API endpoints lack authentication middleware | Tracked for implementation |

### Requirement 10: Log and Monitor All Access

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 10.2.1 — Audit logs capture access | Application structured logging (Winston) | `app/src/logger.js` |
| 10.2.2 — Audit logs include sufficient detail | Request ID, IP, account ID, timestamp in logs | `app/src/index.js` |
| 10.3.1 — Protect audit logs | Logs shipped to OpenSearch via Fluent Bit | `monitoring/logging/` |
| 10.4.1 — Audit logs reviewed | Prometheus alerts + Grafana dashboards | `monitoring/prometheus/`, `monitoring/grafana/` |
| 10.6.1 — Time synchronization | EKS nodes use NTP; container times synced to host | AWS managed |

### Requirement 11: Test Security of Systems and Networks Regularly

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 11.3.1 — Internal vulnerability scans | Checkov + tfsec (IaC), Trivy + Grype (containers) | CI pipeline |
| 11.3.2 — External vulnerability scans | OWASP ZAP DAST scan | CI pipeline |
| 11.4.1 — Penetration testing | ⚠️ Automated DAST; manual pentest not yet scheduled | — |

### Requirement 12: Organizational Policies

| Control | Implementation | Evidence |
|---------|----------------|----------|
| 12.1.1 — Information security policy | ⚠️ Security controls documented but no formal policy | `security/IMPLEMENTATION.md` |
| 12.10.1 — Incident response plan | Security incident runbook | `runbooks/security-incident.md` |
