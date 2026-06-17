locals {
  name = var.name
}

module "tags" {
  source      = "../tags"
  environment = var.environment
  owner       = var.owner
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "dev"
  reuse_nat_ips        = var.environment == "dev"
  external_nat_ip_ids  = var.environment == "dev" ? var.nat_eip_ids : []
  enable_dns_hostnames = true
  enable_dns_support   = true
  enable_flow_log      = false

  public_subnet_tags = {
    Name                                      = "${local.name}-public"
    "kubernetes.io/role/elb"                  = 1
    "kubernetes.io/cluster/${local.name}-eks" = "shared"
  }

  private_subnet_tags = {
    Name                                      = "${local.name}-private"
    "kubernetes.io/role/internal-elb"         = 1
    "kubernetes.io/cluster/${local.name}-eks" = "shared"
  }

  tags = module.tags.tags
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc-flow-log/${local.name}"
  retention_in_days = 365
  kms_key_id        = var.kms_key_arn

  tags = module.tags.tags
}
