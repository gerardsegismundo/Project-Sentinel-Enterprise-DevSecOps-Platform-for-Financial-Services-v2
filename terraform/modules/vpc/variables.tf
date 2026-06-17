variable "name" {
  description = "Base name prefix for VPC resources"
}

variable "environment" {
  description = "Environment name for tagging"
}

variable "owner" {
  description = "Owner tag override"
  default     = ""
}

variable "vpc_cidr" {
  description = "Primary CIDR for the VPC"
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)
}

variable "public_subnets" {
  description = "Public subnet CIDRs"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS Key ARN for CloudWatch Log encryption"
  type        = string
  default     = ""
}

variable "nat_eip_ids" {
  description = "List of EIP allocation IDs to reuse for NAT Gateway (dev only)"
  type        = list(string)
  default     = []
}
