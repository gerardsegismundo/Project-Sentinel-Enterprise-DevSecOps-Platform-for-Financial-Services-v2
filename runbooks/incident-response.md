# Incident Response Runbook

## Severity Classification

| Priority | Description | Response Time | Resolution Target |
|----------|-------------|---------------|-------------------|
| P1 — Critical | Service down, data loss risk, security breach | 5 min | 1 hour |
| P2 — High | Degraded service, high error rate (>5%) | 15 min | 4 hours |
| P3 — Medium | Non-critical feature broken, elevated latency | 1 hour | 24 hours |
| P4 — Low | Cosmetic issue, minor bug | Next business day | 1 week |

## Triage Checklist

### 1. Assess Impact
```bash
# Check pod status
kubectl get pods -n banking -o wide

# Check recent events
kubectl get events -n banking --sort-by='.lastTimestamp' | tail -20

# Check application logs
kubectl logs -n banking -l app=trading-simulator --tail=100 --since=10m

# Check error rate (Prometheus)
# http://<prometheus>:9090/graph?g0.expr=rate(http_requests_total{status=~"5.."}[5m])
```

### 2. Check Golden Signals
```bash
# Latency — p99 response time
kubectl exec -n monitoring deploy/prometheus -- \
  promtool query instant 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))'

# Traffic — requests per second
kubectl exec -n monitoring deploy/prometheus -- \
  promtool query instant 'rate(http_requests_total[5m])'

# Errors — 5xx rate
kubectl exec -n monitoring deploy/prometheus -- \
  promtool query instant 'rate(http_requests_total{status=~"5.."}[5m])'

# Saturation — CPU/memory usage
kubectl top pods -n banking
```

### 3. Check Infrastructure
```bash
# Node status
kubectl get nodes -o wide
kubectl top nodes

# Check EKS control plane
aws eks describe-cluster --name project-sentinel-dev --query 'cluster.status'

# Check recent deployments
helm history trading-simulator -n banking
```

## Common Incident Playbooks

### Application Crash Loop
1. Check pod logs: `kubectl logs -n banking <pod> --previous`
2. Check resource limits: `kubectl describe pod -n banking <pod> | grep -A5 Limits`
3. Check OOMKilled: `kubectl get pods -n banking -o jsonpath='{.items[*].status.containerStatuses[*].lastState}'`
4. If OOM: increase memory limits in `helm/banking-app/values-<env>.yaml`
5. If code error: check recent deployments with `helm history trading-simulator -n banking` and rollback if needed

### High Error Rate (>5%)
1. Check application logs for error patterns: `kubectl logs -n banking -l app=trading-simulator --since=5m | grep -i error`
2. Check if a recent deployment caused the spike: `helm history trading-simulator -n banking`
3. Check downstream dependencies (database, external APIs)
4. If caused by bad deploy: `helm rollback trading-simulator -n banking`
5. If caused by traffic spike: check HPA status and consider scaling

### Node Not Ready
1. Check node conditions: `kubectl describe node <node-name>`
2. Check AWS EC2 instance status: `aws ec2 describe-instance-status --instance-ids <id>`
3. Check kubelet logs (if accessible): `journalctl -u kubelet -n 100`
4. Cordon and drain if needed: `kubectl cordon <node> && kubectl drain <node> --ignore-daemonsets`
5. If node is unrecoverable, terminate and let ASG replace it

## Post-Incident

1. Update incident ticket with timeline and resolution
2. Schedule post-mortem within 48 hours
3. Create follow-up action items
4. Update monitoring/alerting if detection was slow
5. Update this runbook with any new procedures
