output "eks_secrets_key_arn" {
  description = "ARN of KMS key for EKS secrets encryption"
  value       = aws_kms_key.eks_secrets.arn
}

output "ecr_key_arn" {
  description = "ARN of KMS key for ECR image encryption"
  value       = aws_kms_key.ecr.arn
}

output "cloudwatch_key_arn" {
  description = "ARN of KMS key for CloudWatch log encryption"
  value       = aws_kms_key.cloudwatch.arn
}
