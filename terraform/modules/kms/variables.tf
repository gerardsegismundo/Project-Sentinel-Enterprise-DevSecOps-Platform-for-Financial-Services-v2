variable "name" {
  description = "Project name prefix"
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

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
