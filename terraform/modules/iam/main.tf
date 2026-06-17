locals {
  name = var.name
}

module "tags" {
  source      = "../tags"
  environment = var.environment
  owner       = var.owner
  component   = "IAM"
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "github_actions" {
  count = var.create_github_actions_role ? 1 : 0

  name = "${local.name}-github-actions"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${data.aws_iam_openid_connect_provider.github.url}:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "${data.aws_iam_openid_connect_provider.github.url}:sub" = "repo:${var.github_actions_repo}:ref:refs/heads/${var.github_actions_branch}"
          }
        }
      }
    ]
  })
  tags = module.tags.tags
}

resource "aws_iam_role_policy" "github_actions_terraform_state" {
  count = var.create_github_actions_role && var.terraform_state_bucket != "" ? 1 : 0

  name = "TerraformStateAccess"
  role = aws_iam_role.github_actions[0].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetBucketVersioning", "s3:GetBucketLocation"]
        Resource = ["arn:aws:s3:::${var.terraform_state_bucket}", "arn:aws:s3:::${var.terraform_state_bucket}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_ecr" {
  count = var.create_github_actions_role ? 1 : 0

  role       = aws_iam_role.github_actions[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_role_policy_attachment" "github_actions_eks" {
  count = var.create_github_actions_role ? 1 : 0

  role       = aws_iam_role.github_actions[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role_policy_attachment" "github_actions_ssm" {
  count = var.create_github_actions_role ? 1 : 0

  role       = aws_iam_role.github_actions[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
