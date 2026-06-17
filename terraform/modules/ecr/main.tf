locals {
  name = var.repository_name
}

module "tags" {
  source      = "../tags"
  environment = var.environment
  owner       = var.owner
  component   = "ECR"
}

resource "aws_ecr_repository" "main" {
  name                 = local.name
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = var.encryption
    kms_key         = var.kms_key_arn
  }

  tags = module.tags.tags
}
