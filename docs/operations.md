# Operational Documentation

## Environment Overview

| Environment | Cluster | Namespace | Replicas | Autoscaling |
|-------------|---------|-----------|----------|-------------|
| Dev | project-sentinel-dev | banking | 1 | HPA (1–3) |
| Staging | project-sentinel-staging | banking | 2 | Disabled |
| Production | project-sentinel-prod | banking | 3 | HPA (3–10) |

## Access

### Cluster Access
```bash
# Dev
aws eks update-kubeconfig --name project-sentinel-dev --region us-east-1

# Production
aws eks update-kubeconfig --name project-sentinel-prod --region us-east-1
```

### Dashboards
| Tool | URL | Port-Forward |
|------|-----|-------------|
| Grafana | — | `kubectl port-forward -n monitoring svc/grafana 3000:3000` |
| Prometheus | — | `kubectl port-forward -n monitoring svc/prometheus 9090:9090` |
| AlertManager | — | `kubectl port-forward -n monitoring svc/alertmanager 9093:9093` |
| Jaeger UI | — | `kubectl port-forward -n tracing svc/jaeger-query 16686:16686` |
| OpenSearch Dashboards | — | `kubectl port-forward -n logging svc/opensearch-dashboards 5601:5601` |
| ArgoCD | — | `kubectl port-forward -n argocd svc/argocd-server 8080:443` |

## Deployment Lifecycle

### Standard Flow
1. Developer pushes to feature branch → CI runs lint, tests, scans
2. PR created to `master` → full pipeline runs (without deploy)
3. PR merged → pipeline deploys to dev → integration tests → DAST → staging → production → validate

### Rollback
```bash
# Helm rollback (automatic on CI failure)
helm rollback trading-simulator -n banking

# Manual rollback to specific revision
helm history trading-simulator -n banking
helm rollback trading-simulator <revision> -n banking
```

### ArgoCD Sync
```bash
# Check application status
argocd app get trading-simulator-dev
argocd app get trading-simulator-prod

# Force sync
argocd app sync trading-simulator-dev
```

## Monitoring & Alerting

### Alert Routing
| Severity | Receiver | Response Time |
|----------|----------|---------------|
| Critical | PagerDuty (to be configured) | 5 min |
| Warning | Slack (to be configured) | 30 min |
| Application | Email (to be configured) | 1 hour |

### Key Metrics
| Metric | Query | Threshold |
|--------|-------|-----------|
| Error rate | `rate(http_requests_total{status=~"5.."}[5m])` | < 1% |
| P99 latency | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` | < 500ms |
| CPU usage | `container_cpu_usage_seconds_total{namespace="banking"}` | < 70% |
| Memory usage | `container_memory_working_set_bytes{namespace="banking"}` | < 80% |
| Pod restarts | `kube_pod_container_status_restarts_total{namespace="banking"}` | 0 |

### Grafana Dashboards
| Dashboard | Purpose |
|-----------|---------|
| Trading Simulator Overview | Application metrics, request rates, latencies |
| Golden Signals | SRE golden signals (latency, traffic, errors, saturation) |
| Security Overview | Falco alerts, Kyverno violations, NetworkPolicy denials |
| Executive Overview | 7-day availability, transaction volume, compliance status |
| Dev Overview | Development environment health |
| Production Overview | Production environment health |

## Security Operations

### Secrets Management
- Secrets stored in AWS Secrets Manager under `/project-sentinel/<env>/`
- External Secrets Operator syncs secrets to Kubernetes
- Rotation: manually via AWS Console or `aws secretsmanager rotate-secret`

### Certificate Management
- TLS certificates for ingress stored as Kubernetes Secrets
- Production: use cert-manager with Let's Encrypt or ACM

### Security Scanning Schedule
| Scan | Trigger | Tool |
|------|---------|------|
| SAST | Every CI run | Semgrep, SonarQube |
| SCA | Every CI run | Snyk, npm audit |
| Secrets | Every CI run | TruffleHog |
| IaC | Every CI run | Checkov, tfsec |
| Container | Every CI run | Trivy, Grype |
| DAST | Every CI run (post-deploy) | OWASP ZAP |
| Runtime | Continuous | Falco |

## On-Call

### Escalation Path
1. On-call engineer (AlertManager alert)
2. Team lead (if not resolved in 30 min)
3. Security team (if security-related)
4. Platform team (if infrastructure-related)

### Handoff
- Document incident in ticket
- Add timeline to incident response log
- Update monitoring if blind spots found
- Schedule post-mortem within 48 hours
