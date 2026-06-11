locals {
  name = var.repository_name
  common_tags = {
    Project     = "Project Sentinel"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Component   = "ECR"
    Owner       = var.owner
  }
}

resource "aws_ecr_repository" "main" {
  name                 = local.name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = var.encryption
    kms_key         = var.kms_key_arn
  }

  tags = local.common_tags
}
