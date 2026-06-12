# Troubleshooting Runbook

## Diagnostic Commands

### Quick Health Check
```bash
# Cluster status
kubectl cluster-info
kubectl get nodes -o wide
kubectl top nodes

# Application status
kubectl get pods -n banking -o wide
kubectl get svc -n banking
kubectl get events -n banking --sort-by='.lastTimestamp' | tail -20

# Monitoring status
kubectl get pods -n monitoring -o wide
kubectl get pods -n tracing -o wide
kubectl get pods -n logging -o wide
```

## Common Issues

### Pod in CrashLoopBackOff
```bash
# Check logs from the current crash
kubectl logs -n banking <pod-name>

# Check logs from the previous crash
kubectl logs -n banking <pod-name> --previous

# Check pod events
kubectl describe pod -n banking <pod-name>

# Common causes:
# 1. Application error on startup — check logs
# 2. Missing environment variable — check deployment env section
# 3. OOMKilled — check resource limits
# 4. Failed health check — check liveness probe config
# 5. Missing secret/configmap — check mounts
```

### Pod Stuck in Pending
```bash
# Check events for scheduling failures
kubectl describe pod -n banking <pod-name>

# Common causes and fixes:
# 1. Insufficient resources — scale nodes or reduce requests
kubectl top nodes
kubectl describe nodes | grep -A5 "Allocated resources"

# 2. Node selector/affinity mismatch
kubectl get nodes --show-labels

# 3. PVC not bound
kubectl get pvc -n banking
```

### Pod OOMKilled
```bash
# Confirm OOMKill
kubectl get pod <pod> -n banking -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'

# Check actual memory usage
kubectl top pod <pod> -n banking

# Fix: increase memory limit in values file
# Then redeploy via Helm
```

### Service Not Reachable
```bash
# Check service endpoints
kubectl get endpoints -n banking trading-simulator

# Check if pods match selector
kubectl get pods -n banking -l app=trading-simulator --show-labels

# Test connectivity from within cluster
kubectl run debug --rm -it --image=busybox -- wget -qO- http://trading-simulator.banking.svc.cluster.local:3000/health

# Check NetworkPolicy
kubectl get networkpolicies -n banking
kubectl describe networkpolicy trading-simulator-network-policy -n banking
```

### Helm Deployment Failed
```bash
# Check release status
helm status trading-simulator -n banking
helm history trading-simulator -n banking

# Check for pending/failed resources
kubectl get all -n banking -l app.kubernetes.io/managed-by=Helm

# Debug template rendering
helm template trading-simulator helm/banking-app --values helm/banking-app/values-dev.yaml --debug

# Rollback
helm rollback trading-simulator -n banking
```

### High Latency
```bash
# Check application performance
kubectl top pods -n banking

# Check Prometheus for latency metrics
# histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{namespace="banking"}[5m]))

# Check if HPA is maxed out
kubectl get hpa -n banking

# Check node resource pressure
kubectl describe nodes | grep -A10 "Conditions:"

# Check for noisy neighbors
kubectl top pods --all-namespaces --sort-by=cpu | head -10
```

### Prometheus Not Scraping Targets
```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:9090/targets

# Check pod annotations
kubectl get pods -n banking -o jsonpath='{.items[*].metadata.annotations}'
# Ensure prometheus.io/scrape: "true" is set

# Check Prometheus config
kubectl get configmap prometheus-config -n monitoring -o yaml
```

### Fluent Bit Not Shipping Logs
```bash
# Check Fluent Bit pods
kubectl get pods -n logging -l app=fluent-bit

# Check Fluent Bit logs
kubectl logs -n logging -l app=fluent-bit --tail=50

# Check OpenSearch connectivity
kubectl exec -n logging deploy/opensearch -- curl -s http://localhost:9200/_cluster/health

# Check if indices are being created
kubectl exec -n logging deploy/opensearch -- curl -s http://localhost:9200/_cat/indices
```

### Jaeger Traces Missing
```bash
# Check Jaeger pod
kubectl get pods -n tracing -l app=jaeger

# Check OTel endpoint env var in app
kubectl get deployment -n banking trading-simulator -o jsonpath='{.spec.template.spec.containers[0].env}'

# Test connectivity to Jaeger collector
kubectl exec -n banking deploy/trading-simulator -- wget -qO- http://jaeger-collector.tracing.svc.cluster.local:14269/
```

## AWS-Specific Issues

### EKS API Server Unreachable
```bash
# Check cluster status
aws eks describe-cluster --name project-sentinel-dev --query 'cluster.status'

# Check security group rules
aws ec2 describe-security-groups --group-ids <cluster-sg-id>

# Refresh kubeconfig
aws eks update-kubeconfig --name project-sentinel-dev --region us-east-1
```

### ECR Pull Failures
```bash
# Check ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Verify image exists
aws ecr describe-images --repository-name trading-simulator --image-ids imageTag=latest

# Check node IAM role has ECR access
aws iam list-attached-role-policies --role-name <node-role>
```
