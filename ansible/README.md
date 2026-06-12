# Ansible Configuration Management

Configuration management playbooks for Project Sentinel infrastructure.

## Directory Structure

```
ansible/
├── playbooks/           # Top-level playbooks
│   ├── site.yml         # Master playbook — runs all roles
│   ├── eks-setup.yml    # EKS node configuration
│   ├── app-deploy.yml   # Application deployment
│   ├── secrets.yml      # Secrets Manager setup
│   ├── monitoring.yml   # Monitoring stack setup
│   └── hardening.yml    # Security hardening
├── roles/
│   ├── eks-node-config/ # EKS worker node configuration
│   ├── app-deploy/      # Banking application deployment
│   ├── secrets-manager/ # AWS Secrets Manager integration
│   ├── monitoring-setup/# Observability stack deployment
│   └── security-hardening/ # CIS/NIST hardening
├── inventory/
│   ├── dev.yml          # Dev environment inventory
│   └── production.yml   # Production environment inventory
└── group_vars/
    ├── all.yml          # Global variables
    ├── dev.yml          # Dev-specific variables
    └── production.yml   # Production-specific variables
```

## Prerequisites

- Ansible >= 2.15
- Python >= 3.10
- `kubernetes.core` collection: `ansible-galaxy collection install kubernetes.core`
- `amazon.aws` collection: `ansible-galaxy collection install amazon.aws`
- `community.aws` collection: `ansible-galaxy collection install community.aws`
- Valid AWS credentials configured
- `kubectl` configured with cluster access

## Quick Start

```bash
# Install required collections
ansible-galaxy install -r requirements.yml

# Run full setup (dev)
ansible-playbook -i inventory/dev.yml playbooks/site.yml

# Run specific playbook
ansible-playbook -i inventory/dev.yml playbooks/eks-setup.yml

# Dry run
ansible-playbook -i inventory/dev.yml playbooks/site.yml --check --diff
```

## Vault

Sensitive variables are encrypted with Ansible Vault:

```bash
# Encrypt a file
ansible-vault encrypt group_vars/production.yml

# Edit encrypted file
ansible-vault edit group_vars/production.yml

# Run playbook with vault
ansible-playbook -i inventory/production.yml playbooks/site.yml --ask-vault-pass
```
