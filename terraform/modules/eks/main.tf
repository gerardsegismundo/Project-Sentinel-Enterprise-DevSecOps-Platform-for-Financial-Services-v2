locals {
  name = var.name
  common_tags = {
    Project     = "Project Sentinel"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Component   = "EKS"
    Owner       = var.owner
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.16"

  cluster_name    = local.name
  cluster_version = var.cluster_version
  vpc_id          = var.vpc_id
  subnet_ids      = var.private_subnet_ids

  cluster_endpoint_public_access       = true
  cluster_endpoint_public_access_cidrs = var.allowed_public_access_cidrs

  cluster_addons = {
    vpc-cni = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    coredns = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = module.irsa_ebs.iam_role_arn
    }
  }

  fargate_profile_defaults = {
    iam_role_name = "${local.name}-fargate"
    iam_role_arn  = module.irsa_fargate.iam_role_arn
  }

  fargate_profiles = {
    default = {
      name = "default"
      selectors = [
        {
          namespace = "kube-system"
          labels = {
            k8s-app = "kube-dns"
          }
        },
        {
          namespace = "banking"
          labels = {
            app = "trading-simulator"
          }
        }
      ]
    }
  }

  node_security_group_tags = {
    "karpenter.sh/discovery" = local.name
  }

  eks_managed_node_groups = {
    general = {
      name           = "ng"
      instance_types = ["m6i.large"]
      min_size       = var.environment == "dev" ? 1 : 2
      max_size       = 5
      desired_size   = var.environment == "dev" ? 1 : 2

      iam_role_additional_policies = {
        AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      }
    }
  }

  enable_irsa = true

  tags = local.common_tags
}

data "aws_iam_policy_document" "fargate_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["eks-fargate-pods.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

module "irsa_fargate" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${local.name}-fargate-profile"
  role_policy_arns = {
    policy = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["banking:trading-simulator-sa", "kube-system:default"]
    }
  }

  tags = local.common_tags
}

module "irsa_ebs" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${local.name}-ebs-csi-driver"
  role_policy_arns = {
    policy = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:ebs-csi-controller-sa"]
    }
  }

  tags = local.common_tags
}

resource "aws_security_group_rule" "cluster_api" {
  count = var.allowed_cluster_api ? 1 : 0

  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = module.eks.node_security_group_id
  security_group_id        = module.eks.cluster_security_group_id
  description              = "Allow node-to-cluster API access"
}
