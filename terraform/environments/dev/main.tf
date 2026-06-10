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

  backend "s3" {}
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

locals {
  name         = "${var.project_name}-${var.environment}"
  common_tags  = {
    Project     = "Project Sentinel"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }
}

module "vpc" {
  source  = "../../modules/vpc"
  version = "1.0.0"

  name              = local.name
  environment       = var.environment
  vpc_cidr          = var.vpc_cidr
  azs               = data.aws_availability_zones.available.names
  private_subnets   = var.private_subnet_cidrs
  public_subnets    = var.public_subnet_cidrs

  owner = var.owner
}

module "eks" {
  source  = "../../modules/eks"
  version = "1.0.0"

  name                      = local.name
  environment               = var.environment
  owner                     = var.owner
  cluster_version           = var.eks_cluster_version
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  allowed_public_access_cidrs = var.eks_api_allowed_cidrs
  allowed_cluster_api       = true
}

data "aws_caller_identity" "current" {}

data "aws_eks_cluster" "current" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "current" {
  name = module.eks.cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.current.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.current.certificate_authority[0].data)
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
    host                   = data.aws_eks_cluster.current.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.current.certificate_authority[0].data)
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
