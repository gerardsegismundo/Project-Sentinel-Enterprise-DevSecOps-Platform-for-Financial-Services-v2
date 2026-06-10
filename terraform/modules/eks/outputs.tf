output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64-encoded certificate data for EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  value       = module.eks.oidc_provider_arn
}

output "kubeconfig" {
  description = "Kubeconfig for cluster access"
  value = templatefile("${path.module}/kubeconfig.tpl", {
    cluster_endpoint = module.eks.cluster_endpoint
    cluster_name     = module.eks.cluster_name
    certificate      = module.eks.cluster_certificate_authority_data
  })
  sensitive = true
}
