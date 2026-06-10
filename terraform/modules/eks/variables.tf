variable "name" {
  description = "Base name for EKS cluster resources"
  type        = string
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "Gerard Segismundo"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "vpc_id" {
  description = "VPC ID for EKS cluster"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EKS"
  type        = list(string)
}

variable "allowed_public_access_cidrs" {
  description = "CIDRs allowed to access EKS API endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_cluster_api" {
  description = "Allow node-to-cluster API access via security group"
  type        = bool
  default     = true
}
