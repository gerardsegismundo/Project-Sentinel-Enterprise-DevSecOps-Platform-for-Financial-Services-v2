terraform {
  required_version = ">= 1.6.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "github" {
  owner = var.github_org
  token = var.github_token
}

module "github_environments" {
  source = "../../modules/github"

  github_repo  = var.github_repo
  reviewer_ids = jsondecode(var.reviewer_ids)
}
