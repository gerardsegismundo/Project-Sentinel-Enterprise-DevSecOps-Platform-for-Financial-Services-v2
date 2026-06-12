# Scaling Runbook

## Application Scaling

### Horizontal Pod Autoscaler (HPA)
The banking app has an HPA configured. Check current status:
```bash
kubectl get hpa -n banking
kubectl describe hpa trading-simulator -n banking
```

### Manual Scaling
```bash
# Scale to N replicas
kubectl scale deployment/trading-simulator -n banking --replicas=<N>

# Update HPA limits
kubectl patch hpa trading-simulator -n banking -p '{"spec":{"minReplicas":<min>,"maxReplicas":<max>}}'
```

### Scaling via Helm Values
Edit `helm/banking-app/values-<env>.yaml`:
```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```
Then apply:
```bash
helm upgrade trading-simulator helm/banking-app \
  --namespace banking \
  --values helm/banking-app/values-<env>.yaml
```

## Infrastructure Scaling

### EKS Managed Node Group
```bash
# Check current node group
aws eks describe-nodegroup \
  --cluster-name project-sentinel-dev \
  --nodegroup-name <nodegroup-name> \
  --query 'nodegroup.scalingConfig'

# Scale node group
aws eks update-nodegroup-config \
  --cluster-name project-sentinel-dev \
  --nodegroup-name <nodegroup-name> \
  --scaling-config minSize=<min>,maxSize=<max>,desiredSize=<desired>
```

### Scaling via Terraform
Edit `terraform/environments/dev/terraform.tfvars`:
```hcl
eks_node_min_size     = 2
eks_node_max_size     = 6
eks_node_desired_size = 3
```
Then:
```bash
cd terraform/environments/dev
terraform plan -out=tfplan
terraform apply tfplan
```

## Monitoring Stack Scaling

### Prometheus Storage
If Prometheus runs out of storage:
```bash
# Check current storage
kubectl exec -n monitoring deploy/prometheus -- df -h /prometheus

# Update PVC size (if using dynamic provisioning)
kubectl patch pvc prometheus-data -n monitoring -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
```

### OpenSearch Scaling
```bash
# Scale OpenSearch replicas
kubectl scale statefulset/opensearch -n logging --replicas=3
```

## Scaling Decision Matrix

| Signal | Threshold | Action |
|--------|-----------|--------|
| CPU utilization > 70% sustained 5m | Auto (HPA) | Scale out pods |
| Memory utilization > 80% sustained 5m | Auto (HPA) | Scale out pods |
| Node CPU > 80% sustained 15m | Manual | Add nodes to ASG |
| P99 latency > 500ms sustained 10m | Manual | Scale pods or investigate |
| Error rate > 5% sustained 5m | Manual | Investigate root cause first |
| Disk usage > 85% | Alert | Expand storage or clean up |
