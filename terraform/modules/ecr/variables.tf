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
  default     = "AES256"
}
