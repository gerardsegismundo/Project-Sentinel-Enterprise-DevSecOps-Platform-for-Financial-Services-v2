<img width="1254" height="1254" alt="image" src="https://github.com/user-attachments/assets/d9a73504-09e9-40ad-91ed-98c398734426" />

<br />

# 🛡️ Project Sentinel

## 🏦 Enterprise DevSecOps Platform for Financial Services

---

## 📋 Overview

Project Sentinel is a cloud-native DevSecOps platform designed for financial services applications. It demonstrates secure software delivery by integrating Infrastructure as Code (IaC), Kubernetes, CI/CD automation, security scanning, compliance controls, and GitOps deployment strategies on AWS.

The core workload is a **full-stack banking application** with a Next.js (TypeScript) frontend and Express.js API backend, featuring token-based authentication, a modern dark-mode UI with glassmorphism design, hardened security controls (helmet, CORS, rate limiting, structured logging via Winston), and production-ready DevSecOps practices.

---

## 🏗️ Architecture

<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/415fa782-ffd5-4c50-86e7-2615e9594604" />

## 🚀 Project Highlights

* ☁️ AWS Cloud-Native Platform
* ☸️ Amazon EKS Kubernetes
* 🏗️ Terraform Infrastructure as Code
* 🚀 GitHub Actions CI/CD
* 🔄 ArgoCD GitOps Deployment
* 🔒 Enterprise Security Controls
* 📊 Full Observability Stack
* 📚 Compliance Alignment (CIS, PCI-DSS, NIST, SOC2)

---

## ⚙️ Technology Stack

| Category                   | Technology                                                | Icon |
| -------------------------- | --------------------------------------------------------- | ---- |
| Cloud Provider             | AWS                                                       | ☁️   |
| Infrastructure as Code     | Terraform (`terraform/environments/dev/`)                 | 🏗️   |
| Configuration Management   | Ansible                                                   | 🔧   |
| Container Runtime          | Docker                                                    | 📦   |
| Container Orchestration    | Amazon EKS                                                | ☸️   |
| Container Registry         | Amazon ECR (`trading-simulator`)                           | 📦   |
| Helm Charts                | `helm/banking-app`                                        | 📦   |
| GitOps                     | ArgoCD (`gitops/projects/`)                               | 🔄   |
| CI/CD                      | GitHub Actions (`.github/workflows/ci-cd.yml`)            | 🚀   |
| SAST                       | Semgrep, SonarQube                                        | 🔍   |
| Secret Scanning            | TruffleHog (GitHub Action), GitLeaks                      | 🔑   |
| Dependency Scanning        | Snyk                                                      | 🛡️   |
| IaC Scanning               | Checkov, tfsec                                            | 📋   |
| Container Scanning         | Trivy, Grype                                              | 🐳   |
| DAST                       | OWASP ZAP                                                 | 🎯   |
| Monitoring                 | Prometheus (`monitoring/prometheus/`)                     | 📊   |
| Alerting                   | AlertManager (`monitoring/alertmanager/`)                 | 🚨   |
| Dashboards                 | Grafana (`monitoring/grafana/`)                           | 📈   |
| Security Controls          | RBAC, NetworkPolicies, Pod Security Standards (`security/`) | 🔒 |
| Tracing                    | OpenTelemetry, Jaeger (`monitoring/jaeger/`)              | 🔍   |
| Centralized Logging        | Fluent Bit, OpenSearch, OpenSearch Dashboards (`monitoring/logging/`) | 📝 |
| Runtime Security           | Falco (`security/falco/`)                                | 🦅   |
| TLS / Certificates         | cert-manager, Let's Encrypt (`security/tls/`)            | 🔐   |
| Secrets Management         | External Secrets Operator → AWS Secrets Manager           | 🔑   |
| Performance Testing        | k6 (`app/tests/performance/`)                            | ⚡   |
| Synthetic Monitoring       | Custom Node.js probes (`app/tests/synthetic/`)           | 🛰️   |
| Incident Management        | PagerDuty, ServiceNow (AlertManager webhooks)            | 📞   |
| Governance                 | CIS, NIST 800-53, PCI-DSS, SOC 2 (`docs/compliance/`)   | 📚   |

---

## 📂 Repository Structure

```text
├── app/                       # Express.js API server
│   ├── src/
│   │   ├── index.js           # Main application server (serves Next.js static export in production)
│   │   ├── auth.js            # Token-based authentication middleware
│   │   ├── tracing.js         # OpenTelemetry SDK initialization
│   │   ├── middleware.js      # Express middleware (helmet, CORS, rate limiting)
│   │   ├── logger.js          # Winston structured logging
│   │   ├── accounts.js        # Account data and helpers
│   │   └── errors.js          # Error handling middleware
│   ├── tests/                 # Jest unit and integration tests (30 tests)
│   │   ├── performance/       # k6 load test scripts (Golden Signals SLOs)
│   │   └── synthetic/         # Synthetic health monitoring probes
│   ├── package.json           # Dependencies (express, helmet, Winston, OpenTelemetry)
│   └── Dockerfile             # Multi-stage container image (API only)
├── client/                    # Next.js + TypeScript frontend (banking dashboard)
│   ├── src/
│   │   ├── app/page.tsx       # Main app with login, dashboard, transfer, health views
│   │   ├── app/layout.tsx     # Root layout with Geist font and dark theme
│   │   ├── app/globals.css    # Tailwind v4 design system (dark-mode-first)
│   │   └── lib/api.ts         # Typed API client with token management
│   └── package.json           # Next.js 16, React 19, Tailwind CSS 4, TypeScript
├── Dockerfile                 # Full-stack production build (client + server)
├── terraform/                 # Infrastructure as Code
│   ├── environments/          # Per-environment configuration
│   │   ├── dev/               # Development (10.0.0.0/16)
│   │   ├── staging/           # Staging (10.1.0.0/16, S3 backend)
│   │   └── production/        # Production (10.2.0.0/16, S3 backend)
│   └── modules/               # Reusable Terraform modules (vpc, eks, ecr, iam, kms, tags)
├── ansible/                   # Configuration management
│   ├── playbooks/             # Ansible playbooks (site, eks, app, secrets, monitoring, hardening)
│   ├── roles/                 # Roles: eks-node-config, app-deploy, secrets-manager, monitoring-setup, security-hardening, tls-setup
│   ├── inventory/             # Environment inventories (dev, production)
│   └── group_vars/            # Variables per environment
├── helm/
│   └── banking-app/           # Helm chart (release name: trading-simulator)
│       ├── templates/         # Kubernetes manifests
│       ├── values.yaml        # Base defaults
│       ├── values-dev.yaml    # Development overrides
│       ├── values-staging.yaml
│       └── values-production.yaml  # Production (HA, TLS, autoscaling)
├── gitops/
│   ├── appproject.yaml        # ArgoCD AppProject (RBAC-scoped)
│   └── projects/              # ArgoCD Application manifests
│       ├── trading-simulator-dev/
│       ├── trading-simulator-staging/
│       └── trading-simulator-prod/
├── security/                  # Kubernetes security controls
│   ├── rbac/                  # Role-based access control policies
│   ├── network-policies/      # Network segmentation policies
│   ├── kyverno/               # Policy-as-code (prepared, not applied)
│   ├── falco/                 # Runtime security (DaemonSet + banking-specific rules)
│   ├── tls/                   # cert-manager, ClusterIssuers, TLS enforcement policies
│   └── secrets/               # External Secrets Operator manifests
├── monitoring/                # Observability stack
│   ├── prometheus/            # Prometheus config, rules, and deployment
│   ├── grafana/               # Grafana dashboards and datasources
│   ├── alertmanager/          # Alert routing and receivers
│   ├── jaeger/                # Distributed tracing (Jaeger all-in-one)
│   ├── logging/               # Centralized logging (Fluent Bit → OpenSearch)
│   └── dashboards/            # Grafana dashboard JSONs
│       ├── golden-signals.json       # SRE golden signals
│       ├── security-overview.json    # Security posture
│       └── executive-overview.json   # Executive KPIs
├── runbooks/                  # Operational runbooks
│   ├── incident-response.md   # P1–P4 incident handling
│   ├── deployment.md          # Deploy & rollback procedures
│   ├── scaling.md             # Horizontal/vertical scaling
│   ├── troubleshooting.md     # Common issues & diagnostics
│   ├── disaster-recovery.md   # DR procedures (5 scenarios)
│   └── security-incident.md   # Security incident response
├── docs/                      # Documentation
│   ├── compliance/            # CIS, PCI-DSS, NIST 800-53, SOC 2 control mappings
│   ├── demo/                  # Final demonstration guide & materials
│   ├── operations.md          # Operational guide
│   ├── cost-optimization.md   # AWS cost analysis & recommendations
│   └── architecture-decisions.md  # ADRs
└── .github/workflows/
    └── ci-cd.yml              # Full DevSecOps CI/CD pipeline (19 jobs)
```

---

## ✨ Implemented Features

### ☁️ Infrastructure (Terraform)

| Component                         | Status |
| --------------------------------- | ------ |
| 🌐 VPC with public/private subnets | ✅     |
| ☸️ Amazon EKS cluster             | ✅     |
| 📦 Amazon ECR repository          | ✅ (`trading-simulator`) |
| 🔑 IAM OIDC role for GitHub Actions | ✅   |
| 🖥️ EKS node groups                | ✅     |

### 🚀 CI/CD Pipeline (GitHub Actions)

The pipeline (`.github/workflows/ci-cd.yml`) runs on every push to `main` and `develop`:

| Stage                      | Tool              | Gate Type       |
| -------------------------- | ----------------- | --------------- |
| 🔍 Lint & Test             | ESLint, Jest      | Required        |
| 🔑 Secret Scan             | TruffleHog        | Required        |
| 🛡️ SAST                    | Semgrep, SonarQube | Required        |
| 📦 Dependency Scan          | Snyk              | Severity: high+ |
| 📋 IaC Security             | Checkov, tfsec    | Hard fail       |
| 🐳 Container Build & Push   | Docker / Amazon ECR |              |
| 🔎 Container Scan           | Grype, Trivy      | Required        |
| ☁️ Terraform Apply (dev)    | Terraform Cloud   | Environment: dev |
| 🚀 Deploy Dev               | Helm              | `develop` branch |
| 🚀 Deploy Staging           | Helm              | `develop` branch |
| 🧪 Integration Tests        | Jest              | Best effort     |
| 🎯 DAST                     | OWASP ZAP         | Required        |
| 🚀 Deploy Production        | Helm              | `main` branch   |
| ✅ Deployment Validation    | Pod health check  | Required        |
| ↩️ Rollback Production      | Helm rollback     | On failure      |

### 🔒 Security Controls

| Control                        | Status      | Location                                    |
| ------------------------------ | ----------- | ------------------------------------------- |
| 👥 RBAC                        | ✅ Deployed | `security/rbac/rbac-policies.yaml`          |
| 🌐 Network Policies            | ✅ Deployed | `security/network-policies/network-policies.yaml` |
| 🛡️ Pod Security Standards      | ✅ Deployed | `security/pod-security-standards.yaml`      |
| 📋 Kyverno Policies            | 📋 Prepared | `security/kyverno/pod-security-policy.yaml` |
| 🦅 Falco Runtime Security      | ✅ Configured | `security/falco/falco-deployment.yaml`    |
| 🔑 External Secrets (ESO)      | ✅ Configured | `security/secrets/external-secrets.yaml`  |
| 🐳 Container Image Scanning    | ✅ Active   | CI/CD (Grype, Trivy)                        |
| 🔐 Secret Detection            | ✅ Active   | CI/CD (TruffleHog, GitLeaks)               |
| 📋 IaC Security                | ✅ Active   | CI/CD (Checkov, tfsec)                     |
| 🎯 DAST                        | ✅ Active   | CI/CD (OWASP ZAP)                           |

### 📊 Observability (Three Pillars)

| Pillar   | Component              | Status        | Details                                              |
| -------- | ---------------------- | ------------- | ---------------------------------------------------- |
| 📊 Metrics  | Prometheus             | ✅ Deployed   | Application, Kubernetes, and node metrics            |
| 🚨 Alerting | AlertManager           | ✅ Deployed   | Critical and warning alert routing                   |
| 📈 Dashboards | Grafana                | ✅ Deployed   | Trading Simulator Overview dashboard                 |
| 📊 Metrics  | Alert Rules            | ✅ Configured | Pod restarts, high memory/CPU, node health, PVC      |
| 🔍 Tracing  | OpenTelemetry SDK      | ✅ Instrumented | Auto-instrumentation for Express, HTTP, Winston    |
| 🔍 Tracing  | Jaeger                 | ✅ Deployed   | All-in-one collector + query UI (OTLP receiver)      |
| 📝 Logging  | Fluent Bit             | ✅ Deployed   | DaemonSet collecting container logs from banking/monitoring/tracing namespaces |
| 📝 Logging  | OpenSearch             | ✅ Deployed   | Centralized log storage with `logs-banking` index    |
| 📝 Logging  | OpenSearch Dashboards  | ✅ Deployed   | Log visualization and search UI                      |

### 🔄 GitOps

| Environment  | ArgoCD Application            | Namespace |
| ------------ | ----------------------------- | --------- |
| 🔄 Development | `trading-simulator-dev`       | `banking` |
| 🧪 Staging     | `trading-simulator-staging`   | `banking` |
| 🏭 Production  | `trading-simulator-prod`      | `banking` |

---

## 🚀 Getting Started

### Prerequisites

* Terraform >= 1.6.0
* AWS CLI configured
* kubectl
* Helm 3.x
* Node.js >= 18

### 📦 Infrastructure Deployment

```bash
cd terraform/environments/dev/
terraform init
terraform plan
terraform apply
```

### 🖥️ API Server

```bash
cd app
npm install
npm run lint
npm test
npm start          # runs on http://localhost:3000
```

### 🌐 Next.js Frontend

```bash
cd client
npm install
npm run dev        # runs on http://localhost:3000 (uses NEXT_PUBLIC_API_URL for API calls)
npm run build      # static export to out/ (served by Express in production)
```

### 🔑 Authentication

The API uses token-based authentication. In development (no `TOKEN_SECRET` or `API_KEY` env vars set), auth is bypassed. In production, set `TOKEN_SECRET` to enable it.

```bash
# Login (demo accounts: admin, teller, viewer — any password)
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "admin", "password": "any"}'

# Use the returned token
curl http://localhost:3000/api/accounts \
  -H 'Authorization: Bearer <token>'
```

### ☸️ Deploy to Kubernetes

```bash
helm upgrade --install trading-simulator ./helm/banking-app \
  --values ./helm/banking-app/values-dev.yaml \
  --namespace banking --create-namespace
```

---

## 🏛️ OIDC Bootstrap

The pipeline uses progressive OIDC bootstrapping (see `notes.txt`):

1. Create a bootstrap IAM user with permissions to create the GitHub Actions OIDC role
2. Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to GitHub Secrets
3. Push Terraform to `develop` to create the OIDC role
4. Capture `github_actions_role_arn` output
5. Add `AWS_ROLE_ARN` to GitHub Secrets
6. Delete the bootstrap IAM user and its secrets

---

## 📚 Compliance

Detailed control mappings are in `docs/compliance/`.

| Framework       | Controls Addressed                                                      | Document                                      |
| --------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| CIS Kubernetes v1.8 | 24 controls: RBAC, Pod Security, NetworkPolicies, etcd, admission | `docs/compliance/cis-kubernetes-benchmark.md` |
| PCI-DSS v4.0    | 12 requirements: network security, access control, monitoring, testing  | `docs/compliance/pci-dss-controls.md`         |
| NIST SP 800-53  | 41 controls across 8 families: AC, AU, CM, IA, IR, RA, SC, SI           | `docs/compliance/nist-800-53-mapping.md`      |
| SOC 2 Type II   | 5 Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy | `docs/compliance/soc2-controls.md` |

---

## 👨‍💻 Author

**Gerard Segismundo**

---

## ⚠️ Disclaimer

This project is intended for educational and demonstration purposes as a DevSecOps capstone project. It showcases industry best practices for secure cloud-native application delivery and platform engineering.