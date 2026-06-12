locals {
  base_tags = {
    Project     = "Project Sentinel"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }

  component_tag = var.component != "" ? { Component = var.component } : {}

  tags = merge(local.base_tags, local.component_tag, var.extra_tags)
}
