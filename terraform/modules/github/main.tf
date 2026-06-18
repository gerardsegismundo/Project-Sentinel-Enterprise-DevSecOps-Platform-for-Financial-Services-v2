resource "github_repository_environment" "production_approval" {
  repository  = var.github_repo
  environment = "production-approval"

  reviewers {
    users = var.reviewer_ids
  }

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "main_only" {
  repository     = var.github_repo
  environment    = github_repository_environment.production_approval.environment
  branch_pattern = "main"
}

resource "github_repository_environment" "production" {
  repository  = var.github_repo
  environment = "production"

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "production_main_only" {
  repository     = var.github_repo
  environment    = github_repository_environment.production.environment
  branch_pattern = "main"
}
