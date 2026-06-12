# Security Incident Response Runbook

## Classification

| Severity | Examples | Response |
|----------|----------|----------|
| **Critical** | Active breach, data exfiltration, credential leak | Immediate containment, all-hands |
| **High** | Unauthorized access attempt, malware detected | 15 min response, security team |
| **Medium** | Policy violation, suspicious activity | 1 hour response |
| **Low** | Failed login attempts, minor policy drift | Next business day |

## Containment Procedures

### Isolate Compromised Pod
```bash
# Apply deny-all NetworkPolicy to isolate pod
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: emergency-isolate
  namespace: banking
spec:
  podSelector:
    matchLabels:
      app: trading-simulator
  policyTypes:
    - Ingress
    - Egress
EOF

# Scale down to prevent new connections
kubectl scale deployment/trading-simulator -n banking --replicas=0
```

### Preserve Evidence
```bash
# Capture pod state before termination
kubectl get pod <pod-name> -n banking -o yaml > evidence/pod-state-$(date +%s).yaml

# Capture logs
kubectl logs <pod-name> -n banking --all-containers > evidence/pod-logs-$(date +%s).log

# Capture network connections (if debug container available)
kubectl debug <pod-name> -n banking --image=nicolaka/netshoot -- ss -tlnp > evidence/connections.txt

# Snapshot node for forensics (if needed)
aws ec2 create-snapshot --volume-id <vol-id> --description "Forensics $(date)"
```

### Credential Rotation
```bash
# 1. Rotate application secrets
aws secretsmanager put-secret-value \
  --secret-id /project-sentinel/dev/app \
  --secret-string '{"JWT_SECRET":"<new>","SESSION_SECRET":"<new>","ENCRYPTION_KEY":"<new>"}'

# 2. Rotate AWS credentials used in CI/CD
# Generate new keys, update GitHub Secrets, delete old keys

# 3. Rotate Kubernetes tokens
kubectl delete secrets -n banking -l app=trading-simulator
kubectl rollout restart deployment/trading-simulator -n banking

# 4. Rotate Grafana admin password
aws secretsmanager put-secret-value \
  --secret-id /project-sentinel/dev/grafana \
  --secret-string '{"GRAFANA_ADMIN_USER":"admin","GRAFANA_ADMIN_PASSWORD":"<new>"}'
```

## Detection Sources

| Source | What It Detects | Dashboard/Location |
|--------|----------------|-------------------|
| Falco | Runtime anomalies (unexpected processes, file access) | Falcosidekick UI |
| Kyverno | Policy violations (privilege escalation, bad images) | `kubectl get policyreport -A` |
| TruffleHog | Committed secrets in code | CI/CD pipeline |
| Trivy/Grype | Container vulnerabilities | CI artifacts |
| OWASP ZAP | Web application vulnerabilities | CI artifacts |
| Semgrep | Code-level security issues | CI pipeline |
| CloudTrail | AWS API calls (unauthorized access) | AWS Console |
| Kubernetes Audit Logs | API server activity | OpenSearch |

## Investigation Checklist

- [ ] Identify the attack vector (how did they get in?)
- [ ] Determine scope (what systems/data are affected?)
- [ ] Check CloudTrail for unauthorized AWS API calls
- [ ] Check Kubernetes audit logs for suspicious API requests
- [ ] Review Falco alerts for runtime anomalies
- [ ] Check for lateral movement (pods accessing other namespaces)
- [ ] Verify container image integrity (check ECR image digest)
- [ ] Check for persistence mechanisms (cronjobs, new service accounts)
- [ ] Review NetworkPolicy effectiveness
- [ ] Determine if PII/financial data was exposed (PCI-DSS breach notification required)

## Post-Incident

1. Remove emergency isolation NetworkPolicy
2. Redeploy from known-good image
3. Enable enhanced monitoring for 30 days
4. Conduct root cause analysis
5. Update security controls based on findings
6. File compliance notification if PCI-DSS relevant data was exposed (within 72 hours)
7. Update this runbook with lessons learned
