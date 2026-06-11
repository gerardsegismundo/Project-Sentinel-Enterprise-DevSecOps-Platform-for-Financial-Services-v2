locals {
  name = var.name
  common_tags = {
    Project     = "Project Sentinel"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "Gerard Segismundo"
  }
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

  tags = local.common_tags
}

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${local.name}-vpc-endpoints-"
  description = "Security group for VPC endpoints"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(local.common_tags, { Name = "${local.name}-vpc-endpoints" })
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc-flow-log/${local.name}"
  retention_in_days = 30

  tags = local.common_tags
}
