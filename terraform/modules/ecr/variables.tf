variable "repository_name" {
  description = "ECR repository name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "owner" {
  description = "Owner tag"
  type        = string
}

variable "scan_on_push" {
  description = "Enable scanning on push"
  type        = bool
  default     = true
}

variable "encryption" {
  description = "Encryption type for ECR"
  type        = string
  default     = "KMS"
}

variable "image_tag_mutability" {
  description = "ECR image tag mutability: MUTABLE or IMMUTABLE"
  type        = string
  default     = "IMMUTABLE"
}

variable "kms_key_arn" {
  description = "KMS Key ARN for ECR encryption (leave empty for AWS managed key)"
  type        = string
  default     = ""
}
