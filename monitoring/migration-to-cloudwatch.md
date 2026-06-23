# Monitoring Migration: Self-Hosted → CloudWatch

## Rationale

The self-hosted monitoring stack (Prometheus + Grafana + AlertManager + OpenSearch + Jaeger + Fluent Bit) was consuming EC2 managed node resources and added operational complexity. For a sample project, CloudWatch provides sufficient observability at minimal cost.

## What Changed

| Service | Old (Self-Hosted) | New (CloudWatch) | Cost Impact |
|---------|-------------------|------------------|-------------|
| Metrics | Prometheus + Grafana | CloudWatch Container Insights | Free with EKS |
| Logs | Fluent Bit → OpenSearch + Dashboards | CloudWatch Logs | ~$0.50/GB ingested |
| Tracing | OpenTelemetry → Jaeger | AWS X-Ray | Free tier: 100K traces/month |
| Alerts | AlertManager | CloudWatch Alarms | Free tier: 10 alarms |
| Dashboards | Grafana | CloudWatch Dashboards | Free |

## Deploying this Migration

### 1. Enable Container Insights

```bash
# EKS cluster already has CloudWatch agent recommendation
# Enable via EKS console or:
aws eks update-cluster-config \
  --region us-east-1 \
  --name project-sentinel-dev \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
```

### 2. Deploy CloudWatch agent as a Fargate DaemonSet

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-daemonset.yaml
```

### 3. Install AWS X-Ray daemon for tracing

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-xray-container-insights/main/xray-daemonset.yaml
```

### 4. Set CloudWatch Log Retention (30 days for dev)

```hcl
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/project-sentinel-dev/cluster"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "containers" {
  name              = "/aws/containerinsights/project-sentinel-dev/application"
  retention_in_days = 30
}
```

### 5. Create basic CloudWatch Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ContainerInsights", "pod_cpu_utilization", {"stat": "Average"}],
          [".", "pod_memory_utilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "EKS Pod CPU/Memory"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/containerinsights/project-sentinel-dev/application' | fields @timestamp, @message | sort @timestamp desc | limit 50",
        "region": "us-east-1",
        "title": "Recent Container Logs"
      }
    }
  ]
}
```

## Deploying this Migration

To deploy this in Terraform, add to the dev environment's `main.tf`:

```hcl
module "cloudwatch_monitoring" {
  source = "../../modules/cloudwatch-monitoring"

  name        = local.name
  environment = var.environment
  owner       = var.owner
  retention_days = 30
}
```

If you want a new Terraform module, create `terraform/modules/cloudwatch-monitoring/main.tf` with the above resources.

## Rollback

If CloudWatch proves insufficient, you can re-deploy the self-hosted stack by uncommenting the monitoring deployments in `monitoring/` and adding a managed node group back to `terraform/modules/eks/main.tf`.