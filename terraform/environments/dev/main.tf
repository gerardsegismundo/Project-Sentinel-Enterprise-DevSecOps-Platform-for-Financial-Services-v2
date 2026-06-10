terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}

locals {
  name        = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = "Project Sentinel"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

module "vpc" {
  source = "../../modules/vpc"

  name            = local.name
  environment     = var.environment
  vpc_cidr        = var.vpc_cidr
  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  owner = var.owner
}

module "ecr" {
  source = "../../modules/ecr"

  repository_name = "trading-simulator"
  environment     = var.environment
  owner           = var.owner

  scan_on_push = true
  encryption   = "AES256"
}

module "iam" {
  source = "../../modules/iam"

  name                       = local.name
  environment                = var.environment
  owner                      = var.owner
  create_github_actions_role = true
  github_actions_repo        = "${var.github_org}/${var.github_repo}"
  github_actions_branch      = var.environment == "dev" ? "develop" : "main"
}

module "eks" {
  source = "../../modules/eks"

  name                        = local.name
  environment                 = var.environment
  owner                       = var.owner
  cluster_version             = var.eks_cluster_version
  vpc_id                      = module.vpc.vpc_id
  private_subnet_ids          = module.vpc.private_subnet_ids
  allowed_public_access_cidrs = var.eks_api_allowed_cidrs
  allowed_cluster_api         = true
}

resource "aws_iam_role" "github_actions" {
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
            "${data.aws_iam_openid_connect_provider.github.url}:sub" = "repo:${var.github_org}/${var.github_repo}:*"
          }
        }
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "github_actions_ecr" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_role_policy_attachment" "github_actions_eks" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role_policy_attachment" "github_actions_ssm" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_name,
      "--region",
      var.aws_region
    ]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks.cluster_name,
        "--region",
        var.aws_region
      ]
    }
  }
}

resource "kubernetes_namespace" "banking" {
  metadata {
    name = "banking"
    labels = {
      "pod-security.kubernetes.io/enforce" = "restricted"
    }
  }
  depends_on = [module.eks]
}
