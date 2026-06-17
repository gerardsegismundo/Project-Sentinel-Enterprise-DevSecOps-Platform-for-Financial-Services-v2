variable "name" {
  description = "Base name for IAM resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "owner" {
  description = "Owner tag"
  type        = string
  default     = "Gerard Segismundo"
}

variable "create_github_actions_role" {
  description = "Create GitHub Actions OIDC role"
  type        = bool
  default     = true
}

variable "github_actions_repo" {
  description = "GitHub repository (org/repo)"
  type        = string
  default     = ""
}

variable "github_actions_branch" {
  description = "Branch allowed to assume role"
  type        = string
  default     = "main"
}

variable "terraform_state_bucket" {
  description = "S3 bucket name for Terraform state — grants the role read/write access"
  type        = string
  default     = ""
}
