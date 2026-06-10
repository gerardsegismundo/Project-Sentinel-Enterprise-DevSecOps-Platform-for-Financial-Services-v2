output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions role"
  value       = var.create_github_actions_role ? aws_iam_role.github_actions[0].arn : ""
}
