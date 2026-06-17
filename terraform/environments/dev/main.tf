terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket      = "project-sentinel-tfstate-866934333672"
    key         = "dev/terraform.tfstate"
    region      = "us-east-1"
    use_lockfile = true
    encrypt     = true
  }
}

locals {
  name = "${var.project_name}-${var.environment}"
}

module "tags" {
  source      = "../../modules/tags"
  environment = var.environment
  owner       = var.owner
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = module.tags.tags
  }
}

data "aws_availability_zones" "available" {
  state = "available"
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

output "github_actions_role_arn" {
  value = module.iam.github_actions_role_arn
}
