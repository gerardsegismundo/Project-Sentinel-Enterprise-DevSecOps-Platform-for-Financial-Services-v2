# Disaster Recovery Runbook

## Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RTO** (Recovery Time Objective) | 1 hour | Maximum acceptable downtime |
| **RPO** (Recovery Point Objective) | 15 minutes | Maximum data loss window |
| **MTTR** (Mean Time to Recovery) | 30 minutes | Target average recovery time |

## Backup Strategy

### Application State
The trading-simulator is stateless — all state lives in external data stores. Recovery requires only redeploying the container image.

### Infrastructure State
```bash
# Terraform state is the source of truth
# Stored in S3 backend with versioning enabled
aws s3 ls s3://project-sentinel-terraform-state/ --recursive

# Export current Terraform state
cd terraform/environments/dev
terraform state pull > terraform-state-backup-$(date +%Y%m%d).json
```

### Kubernetes Resources
```bash
# Backup all resources in banking namespace
kubectl get all,configmaps,secrets,networkpolicies,hpa -n banking -o yaml > banking-backup-$(date +%Y%m%d).yaml

# Backup monitoring namespace
kubectl get all,configmaps -n monitoring -o yaml > monitoring-backup-$(date +%Y%m%d).yaml

# Backup cluster-level resources
kubectl get clusterroles,clusterrolebindings -o yaml > cluster-rbac-backup-$(date +%Y%m%d).yaml
```

### Secrets
```bash
# Secrets Manager has automatic versioning
# List all project secrets
aws secretsmanager list-secrets --filters Key=name,Values=/project-sentinel
```

## Disaster Scenarios

### Scenario 1: Application Failure (Pod-Level)
**Impact:** Application unavailable, no data loss
**Recovery:**
```bash
# Option A: Rollback last deployment
helm rollback trading-simulator -n banking

# Option B: Force restart all pods
kubectl rollout restart deployment/trading-simulator -n banking

# Option C: Scale down and up
kubectl scale deployment/trading-simulator -n banking --replicas=0
kubectl scale deployment/trading-simulator -n banking --replicas=3

# Verify
kubectl rollout status deployment/trading-simulator -n banking --timeout=5m
```
**Expected RTO:** 5 minutes

### Scenario 2: Namespace Corruption
**Impact:** Application and config lost in namespace
**Recovery:**
```bash
# Recreate namespace with security labels
kubectl apply -f security/pod-security-standards.yaml

# Reapply RBAC and NetworkPolicies
kubectl apply -f security/rbac/rbac-policies.yaml
kubectl apply -f security/network-policies/network-policies.yaml

# Redeploy application
helm upgrade --install trading-simulator helm/banking-app \
  --namespace banking \
  --values helm/banking-app/values-dev.yaml \
  --wait

# OR use Ansible
ansible-playbook -i ansible/inventory/dev.yml ansible/playbooks/site.yml
```
**Expected RTO:** 15 minutes

### Scenario 3: EKS Cluster Failure
**Impact:** Complete cluster loss
**Recovery:**
```bash
# Recreate cluster from Terraform
cd terraform/environments/dev
terraform init
terraform apply -auto-approve

# Update kubeconfig
aws eks update-kubeconfig --name project-sentinel-dev --region us-east-1

# Redeploy everything via Ansible
cd ansible
ansible-playbook -i inventory/dev.yml playbooks/site.yml
```
**Expected RTO:** 45 minutes

### Scenario 4: AWS Region Failure
**Impact:** Complete regional outage
**Recovery:**
1. Switch DNS to secondary region (if configured)
2. Deploy infrastructure to backup region:
```bash
# Create new environment config for backup region
cp terraform/environments/dev terraform/environments/dr-us-west-2
# Update region, AZs, and CIDR in terraform.tfvars
terraform -chdir=terraform/environments/dr-us-west-2 init
terraform -chdir=terraform/environments/dr-us-west-2 apply
```
3. Deploy application to new cluster
4. Update Route53/CloudFront to point to new region

**Expected RTO:** 1 hour

### Scenario 5: Secrets Compromise
**Impact:** Security breach, potential data exposure
**Recovery:**
```bash
# Rotate all secrets immediately
aws secretsmanager rotate-secret --secret-id /project-sentinel/dev/app
aws secretsmanager rotate-secret --secret-id /project-sentinel/dev/database

# Rotate AWS access keys
aws iam create-access-key --user-name <user>
# Update GitHub Secrets with new keys
# Delete old keys
aws iam delete-access-key --user-name <user> --access-key-id <old-key>

# Force pod restart to pick up new secrets
kubectl rollout restart deployment/trading-simulator -n banking

# Rotate Kubernetes service account tokens
kubectl delete serviceaccount trading-simulator-sa -n banking
kubectl apply -f security/rbac/rbac-policies.yaml
```
**Expected RTO:** 30 minutes

## DR Testing Schedule

| Test | Frequency | Last Tested | Next Due |
|------|-----------|-------------|----------|
| Helm rollback | Monthly | — | — |
| Namespace recreation | Quarterly | — | — |
| Cluster rebuild from Terraform | Semi-annually | — | — |
| Full DR drill | Annually | — | — |

## Communication Plan

1. **Detection:** AlertManager sends PagerDuty alert
2. **Triage:** On-call engineer classifies severity (see incident-response.md)
3. **Escalation:** P1/P2 → notify team lead + security team within 15 min
4. **Communication:** Status page update every 30 min during incident
5. **Resolution:** Execute relevant recovery procedure above
6. **Post-mortem:** Conducted within 48 hours
