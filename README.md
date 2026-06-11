# Project Sentinel

## Enterprise DevSecOps Platform for Financial Services

### Overview

Project Sentinel is a cloud-native DevSecOps platform designed for financial services applications. It demonstrates secure software delivery by integrating Infrastructure as Code (IaC), Kubernetes, CI/CD automation, security scanning, compliance controls, and GitOps deployment strategies on AWS.

The core workload is an **Express.js banking application** with hardened security controls (helmet, CORS, rate limiting, structured logging via Winston).

---

## Technology Stack

| Category                   | Technology                                                |
| -------------------------- | --------------------------------------------------------- |
| Cloud Provider             | AWS                                                       |
| Infrastructure as Code     | Terraform (`terraform/environments/dev/`)                 |
| Configuration Management   | Ansible                                                   |
| Container Runtime          | Docker                                                    |
| Container Orchestration    | Amazon EKS                                                |
| Container Registry         | Amazon ECR (`trading-simulator`)                           |
| Helm Charts                | `helm/banking-app`                                        |
| GitOps                     | ArgoCD (`gitops/projects/`)                               |
| CI/CD                      | GitHub Actions (`.github/workflows/ci-cd.yml`)            |
| SAST                       | Semgrep, SonarQube                                        |
| Secret Scanning            | TruffleHog (GitHub Action), GitLeaks                      |
| Dependency Scanning        | Snyk                                                      |
| IaC Scanning               | Checkov, tfsec                                            |
| Container Scanning         | Trivy, Grype                                              |
| DAST                       | OWASP ZAP                                                 |
| Monitoring                 | Prometheus (`monitoring/prometheus/`)                     |
| Alerting                   | AlertManager (`monitoring/alertmanager/`)                 |
| Dashboards                 | Grafana (`monitoring/grafana/`)                           |
| Security Controls          | RBAC, NetworkPolicies, Pod Security Standards (`security/`) |
| Tracing                    | OpenTelemetry                                             |
| Governance                 | CIS, NIST, PCI-DSS                                        |

---

## Repository Structure

```text
├── app/                       # Express.js banking application
│   ├── src/index.js           # Main application server
│   ├── package.json           # Dependencies (express, helmet, Winston, OpenTelemetry)
│   └── Dockerfile             # Container image
├── terraform/                 # Infrastructure as Code
│   ├── environments/dev/      # Dev environment configuration
│   └── modules/               # Reusable Terraform modules (vpc, eks, ecr, iam)
├── ansible/                   # Configuration management playbooks
├── helm/
│   └── banking-app/           # Helm chart (release name: trading-simulator)
│       ├── templates/         # Kubernetes manifests
│       ├── values.yaml        # Production defaults
│       ├── values-dev.yaml    # Development overrides
│       └── values-staging.yaml
├── gitops/
│   └── projects/              # ArgoCD Application manifests
│       ├── trading-simulator-dev/
│       └── trading-simulator-staging/
├── security/                  # Kubernetes security controls
│   ├── rbac/                  # Role-based access control policies
│   ├── network-policies/      # Network segmentation policies
│   └── kyverno/               # Policy-as-code (prepared, not applied)
├── monitoring/                # Observability stack
│   ├── prometheus/            # Prometheus config, rules, and deployment
│   ├── grafana/               # Grafana dashboards and datasources
│   └── alertmanager/          # Alert routing and receivers
├── runbooks/                  # Incident response runbooks
├── docs/                      # Documentation
└── .github/workflows/
    └── ci-cd.yml              # Full DevSecOps CI/CD pipeline
```

---

## Implemented Features

### Infrastructure (Terraform)

| Component             | Status      |
| --------------------- | ----------- |
| VPC with public/private subnets | ✅ |
| Amazon EKS cluster    | ✅          |
| Amazon ECR repository | ✅ (`trading-simulator`) |
| IAM OIDC role for GitHub Actions | ✅ |
| EKS node groups       | ✅          |

### CI/CD Pipeline (GitHub Actions)

The pipeline (`.github/workflows/ci-cd.yml`) runs on every push to `main` and `develop`:

| Stage                  | Tool              | Gate Type       |
| ---------------------- | ----------------- | --------------- |
| Lint & Test            | ESLint, Jest      | Required        |
| Secret Scan            | TruffleHog        | Required        |
| SAST                   | Semgrep, SonarQube | Required        |
| Dependency Scan        | Snyk              | Severity: high+ |
| IaC Security           | Checkov, tfsec    | Hard fail       |
| Container Build & Push | Docker / Amazon ECR |              |
| Container Scan         | Grype, Trivy      | Required        |
| Terraform Apply (dev)  | Terraform Cloud   | Environment: dev |
| Deploy Dev             | Helm              | `develop` branch |
| Deploy Staging         | Helm              | `develop` branch |
| Integration Tests      | Jest              | Best effort     |
| DAST                   | OWASP ZAP         | Required        |
| Deploy Production      | Helm              | `main` branch   |
| Deployment Validation  | Pod health check  | Required        |
| Rollback Production    | Helm rollback     | On failure      |

### Security Controls

| Control                    | Status      | Location                                    |
| -------------------------- | ----------- | ------------------------------------------- |
| RBAC                       | ✅ Deployed | `security/rbac/rbac-policies.yaml`          |
| Network Policies           | ✅ Deployed | `security/network-policies/network-policies.yaml` |
| Pod Security Standards     | ✅ Deployed | `security/pod-security-standards.yaml`      |
| Kyverno Policies           | 📋 Prepared | `security/kyverno/pod-security-policy.yaml` |
| Container Image Scanning   | ✅ Active   | CI/CD (Grype, Trivy)                        |
| Secret Detection           | ✅ Active   | CI/CD (TruffleHog, GitLeaks)               |
| IaC Security               | ✅ Active   | CI/CD (Checkov, tfsec)                     |
| DAST                       | ✅ Active   | CI/CD (OWASP ZAP)                           |

### Observability

| Component        | Status      | Details                                      |
| ---------------- | ----------- | -------------------------------------------- |
| Prometheus       | ✅ Deployed | Application, Kubernetes, and node metrics    |
| AlertManager     | ✅ Deployed | Critical and warning alert routing           |
| Grafana          | ✅ Deployed | Trading Simulator Overview dashboard included |
| Alert Rules      | ✅ Configured | Pod restarts, high memory/CPU, node health, PVC capacity |

### GitOps

| Environment     | ArgoCD Application       | Namespace |
| --------------- | ------------------------ | --------- |
| Development      | `trading-simulator-dev`  | `banking` |
| Staging          | `trading-simulator-staging` | `banking` |

---

## Getting Started

### Prerequisites

- Terraform >= 1.6.0
- AWS CLI configured
- kubectl
- Helm 3.x
- Node.js >= 18

### Infrastructure

```bash
cd terraform/environments/dev/
terraform init
terraform plan
terraform apply
```

### Application

```bash
cd app
npm install
npm run lint
npm test
npm start
```

### Deploy to Kubernetes

```bash
helm upgrade --install trading-simulator ./helm/banking-app \
  --values ./helm/banking-app/values-dev.yaml \
  --namespace banking --create-namespace
```

---

## OIDC Bootstrap

The pipeline uses progressive OIDC bootstrapping (see `notes.txt`):

1. Create a bootstrap IAM user with permissions to create the GitHub Actions OIDC role
2. Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to GitHub Secrets
3. Push Terraform to `develop` to create the OIDC role
4. Capture `github_actions_role_arn` output
5. Add `AWS_ROLE_ARN` to GitHub Secrets
6. Delete the bootstrap IAM user and its secrets

---

## Compliance

| Framework | Controls Addressed                     |
| --------- | -------------------------------------- |
| CIS       | Network Policies, RBAC, Pod Security Standards |
| PCI-DSS   | Access Control, Network Segmentation    |
| NIST CSF  | Access Control (AC), Network Security (SC) |

---

## Author

Gerard Segismundo

---

## Disclaimer

This project is intended for educational and demonstration purposes as a DevSecOps capstone project. It showcases industry best practices for secure cloud-native application delivery and platform engineering.
