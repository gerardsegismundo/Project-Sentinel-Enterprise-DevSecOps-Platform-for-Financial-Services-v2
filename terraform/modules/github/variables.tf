variable "github_repo" {
  description = "GitHub repository name (without owner)"
  type        = string
}

variable "reviewer_ids" {
  description = "List of GitHub user IDs to require approval from before production deployment"
  type        = list(number)
}
