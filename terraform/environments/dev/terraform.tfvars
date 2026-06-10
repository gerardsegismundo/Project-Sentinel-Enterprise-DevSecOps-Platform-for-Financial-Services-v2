project_name = "project-sentinel"
environment  = "dev"
owner        = "Gerard Segismundo"
aws_region   = "us-east-1"

# VPC
vpc_cidr             = "10.0.0.0/16"
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

# EKS
eks_cluster_version   = "1.28"
eks_api_allowed_cidrs = ["0.0.0.0/0"]

# GitHub
github_org  = "gerardsegismundo"
github_repo = "Project-Sentinel"
