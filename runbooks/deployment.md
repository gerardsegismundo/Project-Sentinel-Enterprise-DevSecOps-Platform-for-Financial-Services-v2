# Deployment Runbook

## Standard Deployment (CI/CD)

Deployments are automated via GitHub Actions. Merging a PR to `master` triggers the full pipeline:

1. Lint & Test → Security scans → Build & Push to ECR → Container scan → Deploy Dev → Integration tests → DAST → Deploy Staging → Deploy Production → Validate → Rollback (on failure)

### Pre-Deployment Checklist
- [ ] All CI checks passing on the PR
- [ ] Code reviewed and approved
- [ ] No P1/P2 incidents in progress
- [ ] Deployment window confirmed (avoid peak trading hours)

## Manual Deployment

### Deploy Specific Image Tag
```bash
# Update kubeconfig
aws eks update-kubeconfig --name project-sentinel-dev --region us-east-1

# Deploy via Helm
helm upgrade --install trading-simulator helm/banking-app \
  --namespace banking \
  --values helm/banking-app/values-dev.yaml \
  --set image.tag=<sha-or-tag> \
  --wait --timeout 5m

# Verify
kubectl rollout status deployment/trading-simulator -n banking --timeout=5m
kubectl get pods -n banking -l app=trading-simulator
```

### Deploy via Ansible
```bash
cd ansible
ansible-playbook -i inventory/dev.yml playbooks/app-deploy.yml \
  -e app_image_tag=<sha-or-tag>
```

## Rollback Procedures

### Quick Rollback (Helm)
```bash
# List revision history
helm history trading-simulator -n banking

# Rollback to previous version
helm rollback trading-simulator -n banking

# Rollback to specific revision
helm rollback trading-simulator <revision> -n banking

# Verify rollback
kubectl rollout status deployment/trading-simulator -n banking
```

### Rollback via kubectl
```bash
# Rollback to previous revision
kubectl rollout undo deployment/trading-simulator -n banking

# Rollback to specific revision
kubectl rollout undo deployment/trading-simulator -n banking --to-revision=<n>
```

## Canary Deployment (Manual)

```bash
# Scale down primary to 2 replicas
kubectl scale deployment/trading-simulator -n banking --replicas=2

# Deploy canary with new image
helm upgrade --install trading-simulator-canary helm/banking-app \
  --namespace banking \
  --values helm/banking-app/values-dev.yaml \
  --set image.tag=<new-tag> \
  --set replicaCount=1

# Monitor canary (check error rate for 10 min)
# If healthy: promote by updating the main deployment
# If unhealthy: delete canary
helm uninstall trading-simulator-canary -n banking
```

## Post-Deployment Verification
```bash
# Check pod health
kubectl get pods -n banking -l app=trading-simulator -o wide

# Check application health
kubectl exec -n banking deploy/trading-simulator -- wget -qO- http://localhost:3000/health

# Check recent logs for errors
kubectl logs -n banking -l app=trading-simulator --since=5m | grep -i error

# Verify HPA
kubectl get hpa -n banking
```
