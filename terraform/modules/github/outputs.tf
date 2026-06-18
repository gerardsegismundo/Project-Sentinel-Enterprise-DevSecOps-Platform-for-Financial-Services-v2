output "approval_environment_name" {
  value = github_repository_environment.production_approval.environment
}

output "production_environment_name" {
  value = github_repository_environment.production.environment
}
