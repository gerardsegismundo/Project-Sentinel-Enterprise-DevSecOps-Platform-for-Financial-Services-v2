# Cost Optimization Report

## ✅ Applied Cost-Saving Changes (June 2026)

The following changes have been implemented to reduce the dev environment from ~$223/mo to **~$110/mo**:

| Change | Before | After | Savings |
|--------|--------|-------|---------|
| **Fargate-only EKS** (removed managed node group) | $60/mo (m6i.large × 1) | $0 | **$60/mo** |
| **Single shared KMS key** (was 3 separate keys) | $4/mo (3 keys) | $1/mo (1 key) | **$3/mo** |
| **AES256 ECR encryption** (was KMS) | Included above | $0 | **$0 (simplified)** |
| **2 AZs instead of 3** (reduced subnets) | $5/mo NAT data (3 AZs) | $3/mo NAT data (2 AZs) | **$2/mo** |
| **CloudWatch monitoring** (removed self-hosted stack) | $15/mo (node hosting) | $0 (Fargate-friendly) | **$15/mo** |
| **VPC flow logs removed** | $2/mo | $0 | **$2/mo** |
| **ECR lifecycle policy** (auto-delete untagged images) | Minimal | Free | Storage optimization |
| | | **Total Savings** | **~$82/mo** |

---

## Current Architecture Cost Estimate (Post-Optimization)

Estimated monthly costs for a **dev environment** running in `us-east-1` with Fargate-only EKS.

### Compute

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| EKS Control Plane | 1 cluster | $73 |
| EKS Fargate (banking namespace) | ~0.25 vCPU, 0.5 GiB × 3 pods | $20 |
| **Subtotal** | | **$93** |

### Networking

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| NAT Gateway | 1 (single, dev, 2 AZs) | $32 |
| NAT Data Processing | ~6 GB (reduced with 2 AZs) | $3 |
| ALB (if enabled) | 1 LCU avg | $22 |
| **Subtotal** | | **$57** |

### Storage & Registry

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| ECR | ~2 GB images | $0.10 |
| **Subtotal** | | **$0.10** |

### Security & Monitoring

| Resource | Spec | Monthly Est. |
|----------|------|-------------|
| KMS (1 shared key) | 1 × $1 + API calls | $1 |
| CloudWatch Logs | ~2 GB (reduced retention) | $1 |
| Secrets Manager (3 secrets) | 3 × $0.40 | $1.20 |
| CloudWatch Container Insights | Free with EKS | $0 |
| AWS X-Ray (free tier) | 100K traces/mo | $0 |
| **Subtotal** | | **$3.20** |

### **Total Dev Environment: ~$110/month** (down from $223)

---

## Production Estimate

| Category | Dev (Optimized) | Production |
|----------|----------------|-----------|
| EKS Control Plane | $73 | $73 |
| Fargate (banking, 3–10 pods) | $20 | $80 |
| Managed Nodes (for monitoring in prod) | $0 | $90 |
| Networking (HA NAT, ALB) | $57 | $127 |
| Storage | $0.10 | $5 |
| Security/Monitoring | $3.20 | $15 |
| **Total** | **~$110** | **~$390** |

---

## Optimization Recommendations

### Already Implemented ✅

| Optimization | Est. Saving | Status |
|-------------|-------------|--------|
| Fargate-only EKS (no managed node groups) | ~$60/mo | Done |
| Single shared KMS key | ~$3/mo | Done |
| AES256 ECR encryption (no KMS) | Included | Done |
| Reduced to 2 AZs | ~$2/mo | Done |
| Removed self-hosted monitoring → CloudWatch | ~$15/mo | Done |
| Removed VPC flow logs | ~$2/mo | Done |
| ECR lifecycle policy (7-day untagged expiry) | Storage opt. | Done |

### Further Savings (If Needed)

| Optimization | Est. Saving | Impact |
|-------------|-------------|--------|
| **Replace NAT Gateway with VPC endpoints + SSM** for dev | ~$32/mo | Reduces internet access for private subnets |
| **Scale down to 1 AZ** (not HA) | ~$15/mo | No redundancy for sample project |
| **Use t4g.nano EC2 instead of EKS** | ~$85/mo | Major refactor, lose K8s learning value |
| **Deploy to Lightsail Container Service** | ~$95/mo | Complete migration, simplest setup |
| **Reduce CloudWatch log retention to 7 days** | ~$0.50/mo | Logs rotated quickly |
| **S3 Intelligent-Tiering** for Terraform state | Negligible | Best practice |

### Quick Wins Checklist

- [x] Add ECR lifecycle policy to expire untagged images after 7 days
- [x] Reduce to 2 AZs (sample project doesn't need 3)
- [x] Switch to CloudWatch monitoring (remove self-hosted stack)
- [x] Single shared KMS key instead of 3
- [ ] Enable S3 lifecycle policy for Terraform state versions (expire after 90 days)
- [ ] Set up AWS Budgets alert at $150/month (dev) and $400/month (prod) — updated for lower spend
- [ ] Review CloudWatch log retention — set to 30 days for dev (done), 90 days for prod
- [ ] Enable EBS gp3 (already default) — verify no gp2 volumes remain (EBS removed with nodes)

---

## Cost Monitoring

### AWS Budget Setup (Updated — Lower Thresholds)
```bash
aws budgets create-budget \
  --account-id <ACCOUNT_ID> \
  --budget '{
    "BudgetName": "ProjectSentinel-Dev",
    "BudgetLimit": {"Amount": "150", "Unit": "USD"},
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
