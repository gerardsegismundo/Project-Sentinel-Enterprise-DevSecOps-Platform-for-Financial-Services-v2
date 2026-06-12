# Project Sentinel — Final Demonstration Guide

## Overview

This guide walks through a live demonstration of the Project Sentinel Enterprise DevSecOps Platform for Financial Services. The demo covers all 11 phases of the capstone project.

---

## Pre-Demo Checklist

- [ ] AWS credentials configured (remove `AWSDenyAll` policy)
- [ ] GitHub Secrets set: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- [ ] Optional: `SONAR_TOKEN`, `SONAR_HOST_URL`, `SNYK_TOKEN` for full scan coverage
- [ ] Local Node.js 20+ installed
- [ ] Docker running locally

---

## Demo Flow (30-45 minutes)

### Part 1: Architecture & Design (2 min)

**Show:** `README.md` architecture diagrams

```
┌─────────────────────────────────────────────────────┐
│                    AWS Cloud                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   VPC    │  │   EKS    │  │   ECR Registry   │  │
│  │ 10.x/16 │→ │ Fargate  │← │ Immutable Tags   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│        ↓             ↓                              │
│  ┌──────────┐  ┌──────────────────────────────┐     │
│  │   KMS    │  │   Banking App (Helm)         │     │
│  │ 3 keys  │  │   + Monitoring + Tracing      │     │
│  └──────────┘  └──────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

**Key points:**
- Multi-AZ VPC with public/private subnets
- EKS with Fargate profiles for banking namespace
- ECR with immutable tags and scan-on-push
- KMS encryption for EKS secrets, ECR images, and CloudWatch logs

---

### Part 2: Infrastructure as Code (5 min)

**Show:** `terraform/` directory structure

```bash
# Three environments with isolated state
ls terraform/environments/
# dev/  staging/  production/

# Five reusable modules
ls terraform/modules/
# ecr/  eks/  iam/  kms/  tags/  vpc/

# Validate all environments
terraform -chdir=terraform/environments/dev/ init -backend=false && terraform -chdir=terraform/environments/dev/ validate
terraform -chdir=terraform/environments/staging/ init -backend=false && terraform -chdir=terraform/environments/staging/ validate
terraform -chdir=terraform/environments/production/ init -backend=false && terraform -chdir=terraform/environments/production/ validate
```

**Key points:**
- Each environment has its own CIDR range (10.0/10.1/10.2)
- S3 backend with DynamoDB state locking (staging/prod)
- KMS module provisions 3 encryption keys per environment
- IAM OIDC for GitHub Actions (keyless auth)

---

### Part 3: CI/CD Pipeline (10 min)

**Show:** `.github/workflows/ci-cd.yml` — 19 jobs

```
Pipeline Stages:
1.  Lint & Test ──────────┐
2.  Secret Scan ──────────┤
3.  SAST (SonarQube) ─────┤
4.  SAST (Semgrep) ───────┤──→ Build & Push ──→ Container Scan
5.  Dependency Scan ──────┤          │                  │
6.  IaC Scan (Checkov) ───┘          │                  ↓
    │                           Terraform Apply    Deploy Dev
    │                                              Deploy Staging
    │                                                  │
    ├──→ Integration Tests ←───────────────────────────┘
    ├──→ DAST Scan (OWASP ZAP)
    ├──→ Performance Test (k6)
    ├──→ Synthetic Monitoring
    │
    └──→ Deploy Production → Validate → Rollback (on failure)
```

**Live demo:**
1. Show a recent CI run with all jobs passing
2. Highlight the scan artifacts (Trivy SARIF, Grype JSON, ZAP report)
3. Show the local fallback mode (works without AWS creds)

---

### Part 4: Security Controls (5 min)

**Show:** `security/` directory

| Control | File | Description |
|---------|------|-------------|
| RBAC | `rbac/rbac-policies.yaml` | 4 roles: app, deployer, developer, auditor |
| Network Policies | `network-policies/` | Namespace isolation, ingress/egress rules |
| Pod Security | `pod-security-standards.yaml` | Restricted enforcement on banking NS |
| Kyverno | `kyverno/pod-security-policy.yaml` | Non-root, resource limits, registry allow-list |
| Falco | `falco/falco-deployment.yaml` | Runtime security with banking-specific rules |
| TLS | `tls/cert-manager.yaml` | Let's Encrypt with auto-renewal |
| TLS Policy | `tls/tls-policy.yaml` | Kyverno enforce TLS on banking Ingress |
| External Secrets | `secrets/external-secrets.yaml` | AWS Secrets Manager integration |

---

### Part 5: Observability Stack (5 min)

**Three Pillars:**

| Pillar | Tools | Status |
|--------|-------|--------|
| Metrics | Prometheus → Grafana + AlertManager | Deployed |
| Traces | OpenTelemetry → Jaeger | Deployed |
| Logs | Fluent Bit → OpenSearch → Dashboards | Deployed |

**Dashboards:**
- `monitoring/dashboards/golden-signals.json` — Latency, Traffic, Errors, Saturation
- `monitoring/dashboards/security-overview.json` — Falco alerts, auth failures, policy violations
- `monitoring/dashboards/executive-overview.json` — SLA, uptime, transaction volume

**Alerting:**
- PagerDuty integration for critical + security alerts
- Slack channels for warnings, app alerts, security events
- ServiceNow webhook for compliance ticket creation

---

### Part 6: Application Demo (5 min)

**Start the app:**
```bash
cd app && npm start          # Express API on :3000
cd client && NEXT_PUBLIC_API_URL=http://localhost:3000 npx next dev -p 3001  # Next.js on :3001
```

**Demo flow:**
1. Login as `admin` (any password)
2. View dashboard — Checking: $1,500, Savings: $5,000, Total: $6,500
3. Transfer $100 from Checking → Savings
4. Verify balances update to $1,400 / $5,100
5. Check System Health — status: healthy, version: 1.0.0
6. Logout and try invalid login — shows red error banner

---

### Part 7: GitOps (2 min)

**Show:** `gitops/` directory

- `appproject.yaml` — Scoped ArgoCD project with RBAC
- `projects/trading-simulator-dev/` — Dev environment Application
- `projects/trading-simulator-staging/` — Staging environment Application
- `projects/trading-simulator-prod/` — Production environment Application

---

### Part 8: Configuration Management (2 min)

**Show:** `ansible/` directory

```bash
# 6 playbooks, 6 roles
ls ansible/playbooks/
# app-deploy.yml  eks-setup.yml  hardening.yml  monitoring.yml  secrets.yml  site.yml

ls ansible/roles/
# app-deploy/  eks-node-config/  monitoring-setup/  secrets-manager/  security-hardening/  tls-setup/
```

**Master playbook runs:** EKS config → Security hardening → Secrets → Monitoring → TLS → App deploy

---

### Part 9: Compliance (2 min)

**Show:** `docs/compliance/`

| Framework | Document | Key Controls |
|-----------|----------|-------------|
| CIS | `cis-benchmarks.md` | K8s hardening, network security |
| PCI-DSS | `pci-dss-controls.md` | Req 1-12 mapping |
| NIST 800-53 | `nist-800-53-controls.md` | AC, AU, CM, IA, SC families |
| SOC 2 | `soc2-controls.md` | TSC: Security, Availability, Confidentiality |

---

### Part 10: Operational Readiness (2 min)

**Show:** `runbooks/` and `docs/`

| Document | Purpose |
|----------|---------|
| `runbooks/incident-response.md` | Incident classification + response procedures |
| `runbooks/deployment.md` | Step-by-step deployment checklist |
| `runbooks/scaling.md` | HPA tuning + manual scaling guide |
| `runbooks/troubleshooting.md` | Common issues + resolution steps |
| `runbooks/disaster-recovery.md` | Backup, restore, failover procedures |
| `runbooks/security-incident.md` | Security-specific IR procedures |
| `docs/operations.md` | Day-to-day operations guide |
| `docs/cost-optimization.md` | AWS cost analysis + recommendations |
| `docs/architecture-decisions.md` | ADRs for key technical choices |

---

## Summary Slide

| Phase | Status | Deliverables |
|-------|--------|-------------|
| 1. Architecture & Design | Complete | README diagrams, ADRs |
| 2. Cloud Foundation | Complete | VPC, IAM OIDC, S3 backend |
| 3. Terraform IaC | Complete | 5 modules, 3 environments |
| 4. K8s Platform | Complete | Helm chart, HPA, pod security |
| 5. Security Controls | Complete | RBAC, Kyverno, Falco, TLS, ESO |
| 6. CI/CD Pipeline | Complete | 19-job pipeline, all scan types |
| 7. GitOps | Complete | ArgoCD apps for 3 environments |
| 8. Observability | Complete | Metrics + Traces + Logs + Dashboards |
| 9. Compliance | Complete | CIS, PCI-DSS, NIST, SOC 2 |
| 10. DR & Resilience | Complete | Runbooks, rollback automation |
| 11. Documentation | Complete | Ops guide, cost report, ADRs |
| Frontend | Complete | Next.js + TypeScript, dark-mode UI |

---

## Q&A Preparation

**Expected questions and answers:**

1. **"How do you handle secrets?"** → External Secrets Operator syncs from AWS Secrets Manager. No hardcoded credentials in code or manifests.

2. **"How does the CI/CD pipeline handle failures?"** → Automatic rollback job triggers if deployment validation fails. Pipeline has approval gates for production.

3. **"What's your monitoring strategy?"** → Three-pillar observability (metrics/traces/logs) with Golden Signals dashboards. PagerDuty pages for critical alerts, Slack for warnings.

4. **"How do you ensure PCI-DSS compliance?"** → TLS 1.3 enforced via Kyverno, RBAC least privilege, audit logging, encryption at rest via KMS, network segmentation via NetworkPolicies.

5. **"What's the disaster recovery plan?"** → Multi-AZ deployment, HPA for auto-scaling, Helm rollback automation, runbook-driven procedures for failover and restore.
