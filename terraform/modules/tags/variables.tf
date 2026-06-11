variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "Gerard Segismundo"
}

variable "component" {
  description = "Component name (e.g., VPC, EKS, ECR, IAM)"
  type        = string
  default     = ""
}

variable "extra_tags" {
  description = "Additional tags to merge"
  type        = map(string)
  default     = {}
}
