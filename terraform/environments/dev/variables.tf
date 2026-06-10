variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "project-sentinel"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "Gerard Segismundo"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.28"
}

variable "eks_api_allowed_cidrs" {
  description = "CIDRs allowed to access EKS API"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "gerardsegismundo"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "Project-Sentinel"
}
