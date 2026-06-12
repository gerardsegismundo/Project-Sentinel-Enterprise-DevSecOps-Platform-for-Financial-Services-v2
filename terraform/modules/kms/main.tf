module "tags" {
  source      = "../tags"
  environment = var.environment
  owner       = var.owner
  component   = "KMS"
}

# KMS key for EKS secrets envelope encryption
resource "aws_kms_key" "eks_secrets" {
  description             = "KMS key for EKS secrets encryption - ${var.environment}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(module.tags.tags, {
    Name = "${var.name}-eks-secrets"
  })
}

resource "aws_kms_alias" "eks_secrets" {
  name          = "alias/${var.name}-eks-secrets"
  target_key_id = aws_kms_key.eks_secrets.key_id
}

# KMS key for ECR image encryption
resource "aws_kms_key" "ecr" {
  description             = "KMS key for ECR image encryption - ${var.environment}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(module.tags.tags, {
    Name = "${var.name}-ecr"
  })
}

resource "aws_kms_alias" "ecr" {
  name          = "alias/${var.name}-ecr"
  target_key_id = aws_kms_key.ecr.key_id
}

# KMS key for CloudWatch log encryption
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch log encryption - ${var.environment}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(module.tags.tags, {
    Name = "${var.name}-cloudwatch"
  })
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/${var.name}-cloudwatch"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

data "aws_caller_identity" "current" {}
