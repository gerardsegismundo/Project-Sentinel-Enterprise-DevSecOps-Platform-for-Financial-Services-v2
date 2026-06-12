# Cost Optimization Report

## Current Architecture Cost Estimate

Estimated monthly costs for a **dev environment** running in `us-east-1`.

### Compute

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| EKS Control Plane | 1 cluster | $73 |
| EKS Managed Nodes (t3.medium × 2) | 2 vCPU, 4 GiB each | $60 |
| EKS Fargate (banking namespace) | ~0.25 vCPU, 0.5 GiB × 3 pods | $20 |
| **Subtotal** | | **$153** |

### Networking

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| NAT Gateway | 1 (single, dev) | $32 |
| NAT Data Processing | ~10 GB | $5 |
| ALB (if enabled) | 1 LCU avg | $22 |
| **Subtotal** | | **$59** |

### Storage & Registry

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| ECR | ~2 GB images | $0.20 |
| EBS (gp3, 20 GiB × 2 nodes) | 40 GiB | $3.20 |
| **Subtotal** | | **$3.40** |

### Security & Monitoring

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| KMS (3 keys) | 3 × $1 + API calls | $4 |
| CloudWatch Logs | ~5 GB | $2.50 |
| Secrets Manager (3 secrets) | 3 × $0.40 | $1.20 |
| **Subtotal** | | **$7.70** |

### **Total Dev Environment: ~$223/month**

---

## Production Estimate

| Category | Dev | Production |
|----------|-----|-----------|
| EKS Control Plane | $73 | $73 |
| Compute (3 nodes, HA) | $60 | $180 |
| Fargate (banking, 3–10 pods) | $20 | $80 |
| Networking (HA NAT, ALB) | $59 | $127 |
| Storage | $3.40 | $10 |
| Security/Monitoring | $7.70 | $15 |
| **Total** | **$223** | **$485** |

---

## Optimization Recommendations

### Immediate Savings (Dev)

| Optimization | Est. Saving | Impact |
|-------------|-------------|--------|
| **Use single NAT Gateway** | Already done | $0 (already optimized) |
| **Fargate Spot for dev** | ~$12/mo | 60% discount; acceptable for dev |
| **Scale to 0 at night** (Karpenter or scheduled scaling) | ~$40/mo | No pods running outside business hours |
| **Right-size node instances** (t3.small if sufficient) | ~$15/mo | Monitor CPU/memory first |

### Production Savings

| Optimization | Est. Saving | Impact |
|-------------|-------------|--------|
| **Reserved Instances (1-yr, no upfront)** for nodes | ~$36/mo (20%) | Commit to 1 year |
| **Savings Plans (Compute)** | ~$50/mo (25-30%) | Flexible across instance types |
| **Graviton (ARM) instances** (t4g instead of t3) | ~$18/mo (20%) | Must verify app compatibility |
| **Fargate Spot for non-critical** (monitoring, logging) | ~$15/mo | Acceptable for observability stack |
| **S3 Intelligent-Tiering** for Terraform state | Negligible | Best practice |

### Architectural Optimizations

| Optimization | Description | Effort |
|-------------|-------------|--------|
| **Karpenter** over Cluster Autoscaler | Better bin-packing, spot support | Medium |
| **ALB Controller** instead of Nginx Ingress | Eliminates ingress controller pods | Medium |
| **OpenSearch Serverless** | Pay-per-query instead of always-on | Low |
| **Prometheus remote write to Grafana Cloud** | Remove self-hosted Prometheus | Low |
| **ECR lifecycle policies** | Auto-delete images older than 30 days | Low |

### Quick Wins Checklist

- [ ] Add ECR lifecycle policy to expire untagged images after 7 days
- [ ] Enable S3 lifecycle policy for Terraform state versions (expire after 90 days)
- [ ] Set up AWS Budgets alert at $300/month (dev) and $600/month (prod)
- [ ] Review CloudWatch log retention — set to 30 days for dev, 90 days for prod
- [ ] Enable EBS gp3 (already default) — verify no gp2 volumes remain

---

## Cost Monitoring

### AWS Budget Setup
```bash
aws budgets create-budget \
  --account-id <ACCOUNT_ID> \
  --budget '{
    "BudgetName": "ProjectSentinel-Dev",
    "BudgetLimit": {"Amount": "300", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "team@example.com"}]
  }]'
```

### Cost Explorer Tags
All resources are tagged via the Terraform `tags` module:
- `Project: project-sentinel`
- `Environment: dev/staging/production`
- `Owner: <configured>`
- `Component: VPC/EKS/ECR/IAM/KMS`

Use these tags in AWS Cost Explorer to filter and allocate costs per component and environment.
