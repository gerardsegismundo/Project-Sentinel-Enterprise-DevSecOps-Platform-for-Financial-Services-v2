# CIS Kubernetes Benchmark v1.8 — Compliance Mapping

## Summary

| Category | Controls Assessed | Compliant | Partial | Not Implemented |
|----------|-------------------|-----------|---------|-----------------|
| Control Plane | 8 | 5 | 2 | 1 |
| Worker Nodes | 6 | 4 | 1 | 1 |
| Policies | 10 | 8 | 2 | 0 |
| **Total** | **24** | **17** | **5** | **2** |

## 1. Control Plane Configuration

### 1.1 API Server

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 1.1.1 | Ensure API server audit logging is enabled | ⚠️ Partial | EKS has basic CloudTrail logging; K8s audit logs not forwarded to OpenSearch yet |
| 1.1.2 | Ensure `--anonymous-auth` is set to false | ✅ Pass | EKS managed — anonymous auth disabled by default |
| 1.1.3 | Ensure RBAC authorization is enabled | ✅ Pass | `security/rbac/rbac-policies.yaml` — 4 roles defined |
| 1.1.4 | Ensure admission controllers are configured | ✅ Pass | Kyverno policies in `security/kyverno/pod-security-policy.yaml` |
| 1.1.5 | Ensure `--kubelet-certificate-authority` is set | ✅ Pass | EKS managed — TLS between API server and kubelets |

### 1.2 etcd

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 1.2.1 | Ensure etcd encryption at rest is enabled | ❌ Not Implemented | KMS envelope encryption not configured — tracked for implementation |
| 1.2.2 | Ensure etcd data is backed up | ✅ Pass | EKS managed — AWS handles etcd backups |

### 1.3 Controller Manager

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 1.3.1 | Ensure `--use-service-account-credentials` is true | ✅ Pass | EKS managed default |

## 2. Worker Node Security

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 2.1.1 | Ensure kubelet authentication is configured | ✅ Pass | EKS managed nodes — webhook authentication |
| 2.1.2 | Ensure `--read-only-port` is disabled | ✅ Pass | EKS Fargate profiles disable read-only port |
| 2.2.1 | Ensure node restriction admission is enabled | ✅ Pass | EKS default — NodeRestriction admission plugin |
| 2.3.1 | Minimize access to worker nodes | ⚠️ Partial | Private subnets via VPC module; SSH access restricted but not fully disabled |
| 2.4.1 | Ensure container images use specific tags | ✅ Pass | ECR immutable tags enabled (`terraform/modules/ecr/main.tf`); Kyverno policy requires digest |
| 2.5.1 | Minimize kernel capabilities | ❌ Not Implemented | AppArmor/seccomp profiles defined in pod spec but not validated at node level |

## 3. Policies

### 3.1 RBAC and Service Accounts

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 5.1.1 | Ensure RBAC is used | ✅ Pass | `security/rbac/rbac-policies.yaml` |
| 5.1.2 | Minimize cluster-admin usage | ✅ Pass | Only `github-actions-deployer` has cluster role; app uses namespace-scoped role |
| 5.1.3 | Minimize wildcard RBAC permissions | ✅ Pass | All roles have explicit resource/verb lists |
| 5.1.5 | Ensure default SA is not used | ✅ Pass | `trading-simulator-sa` ServiceAccount; automountServiceAccountToken: false in deployment |

### 3.2 Pod Security

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 5.2.1 | Ensure PodSecurityStandard is enforced | ✅ Pass | `restricted` on banking namespace (`security/pod-security-standards.yaml`) |
| 5.2.2 | Minimize privileged containers | ✅ Pass | Kyverno policy + PSS enforcement |
| 5.2.3 | Do not allow containers to run as root | ✅ Pass | `runAsNonRoot: true` in pod security context; Dockerfile `USER nodeapp` |
| 5.2.4 | Minimize capabilities | ✅ Pass | `drop: ["ALL"]` in security context |

### 3.3 Network Policies

| ID | Control | Status | Evidence |
|----|---------|--------|----------|
| 5.3.1 | Ensure NetworkPolicy is configured | ✅ Pass | 4 policies in `security/network-policies/network-policies.yaml` |
| 5.3.2 | Ensure default deny NetworkPolicy | ⚠️ Partial | Default deny in banking namespace; monitoring/tracing namespaces not restricted |

## Remediation Plan

| ID | Control | Priority | Plan |
|----|---------|----------|------|
| 1.2.1 | etcd encryption at rest | High | Add KMS key + `encryption_config` to EKS Terraform module |
| 2.5.1 | Kernel capabilities validation | Medium | Deploy AppArmor profiles via DaemonSet |
| 1.1.1 | API server audit logging | High | Enable EKS control plane logging → forward to OpenSearch |
| 5.3.2 | Default deny on all namespaces | Medium | Add NetworkPolicies to monitoring/tracing/logging namespaces |
