variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "project-sentinel"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
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
  default     = "10.2.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.2.101.0/24", "10.2.102.0/24", "10.2.103.0/24"]
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.28"
}

variable "eks_api_allowed_cidrs" {
  description = "CIDRs allowed to access EKS API — production restricts to corporate VPN only"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "gerardsegismundo"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "Project-Sentinel-Enterprise-DevSecOps-Platform-for-Financial-Services"
}
