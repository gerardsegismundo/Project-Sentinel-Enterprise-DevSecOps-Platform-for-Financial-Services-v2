# Architecture Decision Records

## ADR-001: EKS with Fargate + Managed Node Groups

**Status:** Accepted

**Context:** Need a Kubernetes platform for the banking application that balances cost, operational overhead, and security requirements.

**Decision:** Use EKS with both Fargate profiles (for the banking application) and managed node groups (for system workloads like monitoring). Fargate provides strong pod-level isolation for financial workloads.

**Consequences:**
- Fargate pods have ~30s startup latency (acceptable for scaling events)
- Monitoring DaemonSets (Fluent Bit, Falco) must run on managed nodes
- Cost is slightly higher than EC2-only but operational overhead is lower

---

## ADR-002: GitHub Actions over Jenkins

**Status:** Accepted

**Context:** Need a CI/CD platform that integrates with the GitHub repository and supports the required security scan stages.

**Decision:** Use GitHub Actions with a 17-stage pipeline. OIDC authentication to AWS eliminates static credential management.

**Consequences:**
- No Jenkins infrastructure to maintain
- GitHub-hosted runners have limited customization
- Self-hosted runners can be added later for specialized workloads

---

## ADR-003: ArgoCD for GitOps Deployments

**Status:** Accepted

**Context:** Deployment to Kubernetes should follow GitOps principles for auditability and rollback capability.

**Decision:** ArgoCD manages deployments from the Helm chart in the repository. CI pushes images to ECR; ArgoCD syncs the desired state.

**Consequences:**
- All deployment changes are tracked in Git
- ArgoCD provides drift detection and auto-healing (production)
- Developers must update Helm values in the repo to deploy

---

## ADR-004: External Secrets Operator for Secrets Management

**Status:** Accepted

**Context:** The application previously had a hardcoded Grafana password. Need centralized secrets management with rotation support.

**Decision:** AWS Secrets Manager + External Secrets Operator. ESO syncs secrets from AWS to Kubernetes Secrets. Ansible roles provision the secrets initially.

**Consequences:**
- No secrets in Git (compliance requirement)
- Secrets rotation requires only an AWS Secrets Manager update
- ESO adds a dependency (CRDs, operator pod)

---

## ADR-005: Three-Pillar Observability

**Status:** Accepted

**Context:** Financial services require comprehensive monitoring for incident detection, root cause analysis, and compliance.

**Decision:**
- **Metrics:** Prometheus + Grafana + AlertManager
- **Logs:** Fluent Bit → OpenSearch (+ Dashboards)
- **Traces:** OpenTelemetry → Jaeger

**Consequences:**
- Full correlation across metrics, logs, and traces
- Self-hosted stack requires operational investment
- Could migrate to managed services (CloudWatch, Grafana Cloud) in the future

---

## ADR-006: Kyverno over OPA/Gatekeeper

**Status:** Accepted

**Context:** Need admission control to enforce security policies (non-root, resource limits, image restrictions).

**Decision:** Kyverno — Kubernetes-native policy engine with YAML-based policies. Simpler learning curve than Rego (OPA).

**Consequences:**
- Policies are written in familiar YAML
- Kyverno can generate and mutate resources (not just validate)
- Smaller community than OPA/Gatekeeper
