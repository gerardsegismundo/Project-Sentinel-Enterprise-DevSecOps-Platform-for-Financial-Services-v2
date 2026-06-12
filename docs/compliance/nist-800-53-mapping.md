# NIST SP 800-53 Rev 5 — Control Mapping

## Applicable Control Families

| Family | ID | Description | Controls Mapped |
|--------|-----|-------------|-----------------|
| Access Control | AC | Access control policies and mechanisms | 8 |
| Audit and Accountability | AU | Logging, monitoring, audit trails | 6 |
| Configuration Management | CM | System configuration and change control | 5 |
| Identification and Authentication | IA | Identity management | 4 |
| Incident Response | IR | Incident detection and response | 4 |
| Risk Assessment | RA | Vulnerability scanning, risk analysis | 3 |
| System and Communications Protection | SC | Network security, encryption | 6 |
| System and Information Integrity | SI | Malware protection, monitoring | 5 |

---

## Access Control (AC)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| AC-2 | Account Management | RBAC roles: app, deployer, developer, security-auditor (`security/rbac/`) | ✅ |
| AC-3 | Access Enforcement | Kubernetes RBAC + Pod Security Standards | ✅ |
| AC-4 | Information Flow Enforcement | NetworkPolicies restrict pod communication | ✅ |
| AC-6 | Least Privilege | Namespace-scoped roles; drop ALL capabilities; read-only FS | ✅ |
| AC-6(9) | Log Privileged Functions | Structured logging with request ID and user context | ✅ |
| AC-14 | Permitted Actions Without Identification | Health endpoint (`/health`) is the only unauthenticated route | ⚠️ |
| AC-17 | Remote Access | EKS API restricted to `10.0.0.0/8`; SSH disabled | ✅ |
| AC-24 | Access Control Decisions | Kyverno admission policies for runtime enforcement | ✅ |

## Audit and Accountability (AU)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| AU-2 | Event Logging | Winston structured logging; Fluent Bit collection | ✅ |
| AU-3 | Content of Audit Records | Timestamp, request ID, source IP, account ID, action | ✅ |
| AU-6 | Audit Record Review | Grafana dashboards + OpenSearch Dashboards | ✅ |
| AU-8 | Time Stamps | NTP synchronized (AWS managed); ISO 8601 format in logs | ✅ |
| AU-9 | Protection of Audit Information | Logs shipped to OpenSearch; Fluent Bit runs as DaemonSet | ✅ |
| AU-12 | Audit Record Generation | CI/CD pipeline logs; application logs; K8s events | ✅ |

## Configuration Management (CM)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| CM-2 | Baseline Configuration | Terraform modules define infrastructure baseline | ✅ |
| CM-3 | Configuration Change Control | GitHub PR workflow; CI/CD validates all changes | ✅ |
| CM-6 | Configuration Settings | Ansible roles enforce consistent configuration | ✅ |
| CM-7 | Least Functionality | Multi-stage Docker build; minimal Alpine image; non-root user | ✅ |
| CM-8 | System Component Inventory | Terraform state tracks all infrastructure components | ✅ |

## Identification and Authentication (IA)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| IA-2 | Identification and Authentication | GitHub OIDC for CI/CD; IAM for AWS access | ✅ |
| IA-5 | Authenticator Management | AWS Secrets Manager for credential storage | ✅ |
| IA-8 | Identification (Non-Organizational Users) | ⚠️ API endpoints lack authentication middleware | ⚠️ |
| IA-9 | Service Identification | ServiceAccount per workload; OIDC for cross-service auth | ✅ |

## Incident Response (IR)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| IR-4 | Incident Handling | Incident response runbook (`runbooks/incident-response.md`) | ✅ |
| IR-5 | Incident Monitoring | Prometheus alerts + AlertManager routing | ✅ |
| IR-6 | Incident Reporting | Security incident runbook with escalation procedures | ✅ |
| IR-8 | Incident Response Plan | Full runbooks for incidents, security, DR | ✅ |

## Risk Assessment (RA)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| RA-5 | Vulnerability Monitoring and Scanning | Trivy, Grype, Checkov, tfsec, Semgrep, OWASP ZAP in CI/CD | ✅ |
| RA-5(2) | Update Vulnerabilities to Be Scanned | Snyk + npm audit for dependency vulnerabilities | ✅ |
| RA-5(5) | Privileged Access | IaC scanning prevents privilege escalation in infra | ✅ |

## System and Communications Protection (SC)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| SC-4 | Information in Shared Resources | Namespace isolation; pod security contexts | ✅ |
| SC-7 | Boundary Protection | VPC with public/private subnets; NetworkPolicies | ✅ |
| SC-8 | Transmission Confidentiality | ⚠️ TLS at ALB planned; in-cluster traffic unencrypted | ⚠️ |
| SC-12 | Cryptographic Key Establishment | ⚠️ KMS integration planned for secrets encryption | ⚠️ |
| SC-13 | Cryptographic Protection | Helmet security headers; HSTS configured | ✅ |
| SC-28 | Protection of Information at Rest | ⚠️ EBS encryption enabled; etcd encryption pending | ⚠️ |

## System and Information Integrity (SI)

| Control | Description | Implementation | Status |
|---------|-------------|----------------|--------|
| SI-2 | Flaw Remediation | Automated dependency scanning; container rebuild on vulnerabilities | ✅ |
| SI-3 | Malicious Code Protection | Container scanning (Trivy + Grype); Falco runtime detection | ✅ |
| SI-4 | System Monitoring | Prometheus + Grafana + AlertManager; Fluent Bit logging | ✅ |
| SI-5 | Security Alerts and Advisories | AlertManager routing to critical/warning/application channels | ✅ |
| SI-10 | Information Input Validation | Express input validation: numeric account IDs, transfer amount validation, 100KB body limit | ✅ |
