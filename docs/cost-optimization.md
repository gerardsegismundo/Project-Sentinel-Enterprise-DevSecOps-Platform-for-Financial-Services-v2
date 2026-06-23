# Cost Optimization Report

## 💡 Target: Reduce Dev Environment Cost (~$223/mo → ~$110/mo)

The following recommendations outline how the current architecture can be optimized for lower-cost development while maintaining core DevSecOps and Kubernetes learning objectives.

---

## 1. Compute Optimization (EKS / Fargate)

### Recommended Changes

| Optimization | Description | Estimated Savings |
|--------------|-------------|------------------|
| **Use Fargate-only EKS** | Remove managed node groups and run workloads on Fargate | ~$60/mo |
| **Right-size Fargate workloads** | Minimize CPU/memory allocations for non-critical services | Variable |
| **Avoid over-provisioned pods** | Ensure requests/limits match actual usage | 10–20% compute reduction |

### Notes
- Keeps Kubernetes abstraction intact
- Reduces EC2 management overhead
- Best fit for dev/test environments

---

## 2. Networking Optimization

### Recommended Changes

| Optimization | Description | Estimated Savings |
|--------------|-------------|------------------|
| **Reduce AZ usage (3 → 2)** | Use fewer subnets for dev workloads | ~$2–$5/mo |
| **Replace NAT Gateway (optional)** | Use VPC endpoints + SSM for private access | ~$30/mo |
| **Reduce ALB usage (if not needed)** | Use port-forwarding or single ingress in dev | ~$20/mo |

### Notes
- NAT Gateway is typically the largest hidden cost driver
- VPC endpoints can significantly reduce outbound traffic charges
- Multi-AZ is not strictly necessary for dev environments

---

## 3. Storage & Container Registry

### Recommended Changes

| Optimization | Description | Estimated Savings |
|--------------|-------------|------------------|
| **Enable ECR lifecycle policies** | Automatically delete untagged/old images | Storage reduction |
| **Minimize image size** | Use multi-stage Docker builds | Reduced storage + faster pulls |
| **Limit retained images** | Keep only recent builds | Cost + performance benefit |

---

## 4. Security & Observability

### Recommended Changes

| Optimization | Description | Estimated Savings |
|--------------|-------------|------------------|
| **Use single shared KMS key** | Replace multiple CMKs with one reusable key | ~$3/mo |
| **Switch to AES256 for ECR** | Avoid KMS-backed encryption overhead | Simplifies + reduces cost |
| **Remove VPC Flow Logs (dev)** | Disable or sample-only logging | ~$2/mo |
| **Use CloudWatch instead of self-hosted logging stack** | Managed observability instead of EC2-based logging | ~$15/mo |

### Notes
- Centralized observability reduces infrastructure overhead
- Retention policies should be adjusted for dev vs prod

---

## 5. Cost Governance & Monitoring

### Recommended Setup

| Tool | Purpose |
|------|--------|
| **AWS Budgets** | Alert when dev spend exceeds $150/month |
| **Cost Explorer Tags** | Track cost per environment/component |
| **CloudWatch cost metrics** | Monitor usage trends |

### Suggested Budget Thresholds
- Dev: $150/month alert
- Prod: $400/month alert

---

## 6. Further Cost Reduction (Optional / Aggressive)

| Optimization | Impact | Tradeoff |
|--------------|--------|----------|
| **Single AZ deployment** | ~$15/mo savings | No high availability |
| **Remove NAT Gateway entirely (dev)** | ~$30/mo savings | Requires redesign using endpoints |
| **Replace EKS with EC2 or Lightsail** | ~$80–$95/mo savings | Loses Kubernetes learning value |
| **Use serverless containers (Lightsail / App Runner)** | Major simplification | Reduced control over architecture |

---

## 7. Tagging Strategy (Cost Attribution)

Ensure all resources are consistently tagged for cost tracking:

- Project: project-sentinel
- Environment: dev / staging / prod
- Component: networking / compute / security
- Owner: <team or individual>

This enables:
- AWS Cost Explorer filtering
- Per-environment billing visibility
- Better FinOps practices

---

## Summary

A well-optimized dev environment should prioritize:
- Minimal redundancy (fewer AZs, smaller footprint)
- Managed services over self-hosted infrastructure
- Aggressive lifecycle and retention policies
- Clear cost monitoring and alerting

Expected outcome:
A reduction from approximately $223/month to ~$110/month for a DevSecOps Kubernetes environment while preserving core learning and architecture realism.
