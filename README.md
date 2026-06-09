# Project Sentinel

## Enterprise DevSecOps Platform for Financial Services

### Overview

Project Sentinel is a cloud-native DevSecOps platform designed for financial services applications. The platform demonstrates secure software delivery practices by integrating Infrastructure as Code (IaC), Kubernetes, CI/CD automation, security scanning, compliance controls, monitoring, logging, and GitOps deployment strategies.

The project is built on AWS and follows modern DevSecOps principles to provide a secure, scalable, and highly automated application delivery platform.

---

## Objectives

* Automate infrastructure provisioning using Terraform
* Implement secure CI/CD pipelines with GitHub Actions
* Deploy applications to Amazon EKS using GitOps with ArgoCD
* Integrate security scanning throughout the SDLC
* Provide centralized monitoring, logging, and alerting
* Demonstrate compliance-aligned cloud security practices
* Improve deployment consistency, reliability, and auditability

---

## Technology Stack

| Category                 | Technology                                            |
| ------------------------ | ----------------------------------------------------- |
| Cloud                    | AWS                                                   |
| Infrastructure as Code   | Terraform                                             |
| Configuration Management | Ansible                                               |
| Containers               | Docker                                                |
| Container Registry       | Amazon ECR                                            |
| Kubernetes               | Amazon EKS                                            |
| CI/CD                    | GitHub Actions                                        |
| GitOps                   | ArgoCD                                                |
| Security                 | Checkov, tfsec, Trivy, GitLeaks, SonarQube, OWASP ZAP |
| Monitoring               | Prometheus, Grafana, AlertManager                     |
| Logging                  | Fluent Bit, OpenSearch, Kibana                        |
| Tracing                  | OpenTelemetry, Jaeger                                 |
| Secrets Management       | AWS Secrets Manager                                   |
| Governance               | CIS, NIST, PCI-DSS, SOC 2                             |

---

## Repository Structure

```text
/
├── terraform/
├── ansible/
├── app/
├── helm/
├── gitops/
├── security/
├── monitoring/
├── runbooks/
├── docs/
└── .github/workflows/
```

---

## Planned Features

### Infrastructure

* AWS networking and security foundations
* Amazon EKS cluster deployment
* Amazon ECR repositories
* IAM roles and policies
* Secrets management

### CI/CD

* Automated build and testing
* Security validation gates
* Container image publishing
* Environment-based deployments

### Security

* SAST scanning
* Dependency scanning
* Secret detection
* IaC security validation
* Container vulnerability scanning
* Runtime security monitoring

### Observability

* Metrics collection
* Centralized logging
* Distributed tracing
* Alerting and dashboards

---

## Project Status

🚧 Currently in development.

Initial focus areas:

1. AWS infrastructure deployment
2. Terraform module development
3. EKS platform setup
4. GitHub Actions CI/CD pipeline
5. ArgoCD GitOps implementation

---

## Future Enhancements

* Advanced compliance reporting
* Multi-environment deployments
* Disaster recovery automation
* Security policy enforcement
* Automated rollback mechanisms
* Cost optimization reporting

---

## Author

Gerard Segismundo

---

## Disclaimer

This project is intended for educational and demonstration purposes as a DevSecOps capstone project. It showcases industry best practices for secure cloud-native application delivery and platform engineering.
