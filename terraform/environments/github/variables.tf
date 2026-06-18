variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name (without owner)"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token with repo and admin permissions"
  type        = string
  sensitive   = true
}

variable "reviewer_ids" {
  description = "JSON-encoded list of GitHub user IDs, e.g. '[12345678]'"
  type        = string
}
