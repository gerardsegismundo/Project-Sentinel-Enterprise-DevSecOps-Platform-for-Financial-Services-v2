<#
.SYNOPSIS
    Cleanup script for project-sentinel-dev AWS resources
.DESCRIPTION
    Destroys all AWS resources associated with project-sentinel-dev environment.
    ACCOUNT: 866934333672 | REGION: us-east-1
.NOTES
    Run with -Force to skip all prompts
#>

param(
    [switch]$Force,
    [string]$Region = "us-east-1",
    [string]$AccountId = "866934333672",
    [string]$ClusterName = "project-sentinel-dev"
)

$ErrorActionPreference = "Continue"

function Confirm-Step {
    param([string]$Message)
    if (-not $Force) {
        $response = Read-Host "`n** $Message`n  Proceed? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "  ** Skipped." -ForegroundColor Yellow
            return $false
        }
    }
    return $true
}

function Run-AWS {
    param([string]$Command, [string]$Description)
    Write-Host "`n-> $Description ..." -ForegroundColor Cyan
    Write-Host "  aws $Command" -ForegroundColor Gray
    $output = aws $Command 2>&1
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 254) {
        Write-Host "  ** Command returned exit code $LASTEXITCODE (resource may not exist)" -ForegroundColor Yellow
    } elseif ($output) {
        Write-Host "  $output" -ForegroundColor Gray
    }
}

# ─── Pre-flight Checks ───────────────────────────────────────────────────
Write-Host "=========================================================" -ForegroundColor Magenta
Write-Host "  project-sentinel-dev -- FULL AWS CLEANUP" -ForegroundColor Magenta
Write-Host "  Account: $AccountId" -ForegroundColor Magenta
Write-Host "  Region:  $Region" -ForegroundColor Magenta
Write-Host "  Cluster: $ClusterName" -ForegroundColor Magenta
Write-Host "=========================================================" -ForegroundColor Magenta

try {
    $awsVersion = aws --version 2>&1
    Write-Host "  AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "  AWS CLI is not installed." -ForegroundColor Red
    Write-Host "  Install from: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    exit 1
}

$callerId = aws sts get-caller-identity --query Account --output text 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Not authenticated. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}
Write-Host "  Authenticated as account: $callerId" -ForegroundColor Green
if ($callerId -ne $AccountId) {
    Write-Host "  WARNING: Connected account ($callerId) != target ($AccountId)" -ForegroundColor Yellow
    if (-not (Confirm-Step "Account mismatch. Continue anyway?")) { exit }
}

if (-not $Force) {
    Write-Host "`n!! THIS WILL DELETE ALL project-sentinel RESOURCES IN us-east-1" -ForegroundColor Red
    Write-Host "   This is IRREVERSIBLE.`n" -ForegroundColor Red
    if (-not (Confirm-Step "Delete ALL resources for $ClusterName?")) { exit }
}

# ─── 1. Skip K8s - cluster endpoint is unreachable ───────────────────────
Write-Host "`n-> Note: EKS cluster endpoint is not reachable from this machine." -ForegroundColor Yellow
Write-Host "  Skipping kubectl-based cleanup. The EKS cluster will be deleted via AWS CLI." -ForegroundColor Yellow

# ─── 2. Delete EKS Cluster ───────────────────────────────────────────────
if (Confirm-Step "Step 2/8: Delete EKS cluster: $ClusterName") {
    # List and delete nodegroups
    $ngs = aws eks list-nodegroups --cluster-name $ClusterName --region $Region --query nodegroups[] --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $ngs -and $ngs -ne "None") {
        foreach ($ng in $ngs) {
            if ($ng -match '^\s*$') { continue }
            Run-AWS "eks delete-nodegroup --cluster-name $ClusterName --nodegroup-name $ng --region $Region" "Deleting nodegroup: $ng"
        }
        Start-Sleep -Seconds 10
    }
    
    # List and delete Fargate profiles
    $fps = aws eks list-fargate-profiles --cluster-name $ClusterName --region $Region --query fargateProfileNames[] --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $fps -and $fps -ne "None") {
        foreach ($fp in $fps) {
            if ($fp -match '^\s*$') { continue }
            Run-AWS "eks delete-fargate-profile --cluster-name $ClusterName --fargate-profile-name $fp --region $Region" "Deleting Fargate profile: $fp"
        }
    }
    
    # Delete the cluster itself
    Run-AWS "eks delete-cluster --name $ClusterName --region $Region" "Deleting EKS cluster: $ClusterName"
    
    # Delete eksctl CloudFormation stacks
    $cfStacks = aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --region $Region --query "StackSummaries[?contains(StackName,'eksctl-$ClusterName')].StackName" --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $cfStacks -and $cfStacks -ne "None") {
        foreach ($stack in $cfStacks) {
            if ($stack -match '^\s*$') { continue }
            Run-AWS "cloudformation delete-stack --stack-name $stack --region $Region" "Deleting CloudFormation stack: $stack"
        }
    }
}

# ─── 3. Delete ECR Repositories ──────────────────────────────────────────
if (Confirm-Step "Step 3/8: Delete ECR repositories") {
    $repos = aws ecr describe-repositories --region $Region --query "repositories[].repositoryName" --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $repos -and $repos -ne "None") {
        foreach ($repo in $repos) {
            if ($repo -match '^\s*$') { continue }
            Run-AWS "ecr delete-repository --repository-name $repo --force --region $Region" "Deleting ECR repo: $repo"
        }
    }
}

# ─── 4. Delete Load Balancers ────────────────────────────────────────────
if (Confirm-Step "Step 4/8: Delete load balancers") {
    $lbs = aws elbv2 describe-load-balancers --region $Region --query "LoadBalancers[].LoadBalancerArn" --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $lbs -and $lbs -ne "None") {
        foreach ($arn in $lbs) {
            if ($arn -match '^\s*$') { continue }
            Run-AWS "elbv2 delete-load-balancer --load-balancer-arn $arn --region $Region" "Deleting ALB: $arn"
        }
    }
    
    $tgs = aws elbv2 describe-target-groups --region $Region --query "TargetGroups[].TargetGroupArn" --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $tgs -and $tgs -ne "None") {
        foreach ($arn in $tgs) {
            if ($arn -match '^\s*$') { continue }
            Run-AWS "elbv2 delete-target-group --target-group-arn $arn --region $Region" "Deleting target group: $arn"
        }
    }
}

# ─── 5. Delete NAT Gateways & VPC Resources ─────────────────────────────
if (Confirm-Step "Step 5/8: Delete network resources") {
    $vpcId = aws ec2 describe-vpcs --region $Region --filters "Name=tag:Name,Values=*eksctl*" --query "Vpcs[0].VpcId" --output text 2>&1
    if ($LASTEXITCODE -ne 0 -or !$vpcId -or $vpcId -eq "None") {
        $vpcId = aws ec2 describe-vpcs --region $Region --filters "Name=tag:alpha.eksctl.io/cluster-name,Values=$ClusterName" --query "Vpcs[0].VpcId" --output text 2>&1
    }
    
    if ($LASTEXITCODE -eq 0 -and $vpcId -and $vpcId -ne "None") {
        Write-Host "  Found VPC: $vpcId" -ForegroundColor Cyan
        
        # Delete NAT Gateways
        $ngws = aws ec2 describe-nat-gateways --region $Region --filter "Name=vpc-id,Values=$vpcId" --query "NatGateways[].NatGatewayId" --output text 2>&1
        if ($LASTEXITCODE -eq 0 -and $ngws -and $ngws -ne "None") {
            foreach ($ngw in $ngws) {
                if ($ngw -match '^\s*$') { continue }
                Run-AWS "ec2 delete-nat-gateway --nat-gateway-id $ngw --region $Region" "Deleting NAT Gateway: $ngw"
            }
            Write-Host "  Waiting 15s for NAT Gateway deletions to propagate..." -ForegroundColor Cyan
            Start-Sleep -Seconds 15
        }
        
        # Delete VPC Endpoints
        $vpcEndpoints = aws ec2 describe-vpc-endpoints --region $Region --filters "Name=vpc-id,Values=$vpcId" --query "VpcEndpoints[].VpcEndpointId" --output text 2>&1
        if ($LASTEXITCODE -eq 0 -and $vpcEndpoints -and $vpcEndpoints -ne "None") {
            $epList = ($vpcEndpoints -split '\s+' | Where-Object { $_ -and $_ -notmatch '^\s*$' }) -join ' '
            if ($epList) {
                Run-AWS "ec2 delete-vpc-endpoints --vpc-endpoint-ids $epList --region $Region" "Deleting VPC endpoints"
            }
        }
        
        # Delete Internet Gateway
        $igws = aws ec2 describe-internet-gateways --region $Region --filters "Name=attachment.vpc-id,Values=$vpcId" --query "InternetGateways[].InternetGatewayId" --output text 2>&1
        if ($LASTEXITCODE -eq 0 -and $igws -and $igws -ne "None") {
            foreach ($igw in $igws) {
                if ($igw -match '^\s*$') { continue }
                Run-AWS "ec2 detach-internet-gateway --internet-gateway-id $igw --vpc-id $vpcId --region $Region" "Detaching IGW: $igw"
                Run-AWS "ec2 delete-internet-gateway --internet-gateway-id $igw --region $Region" "Deleting IGW: $igw"
            }
        }
        
        # Delete Subnets
        $subnets = aws ec2 describe-subnets --region $Region --filters "Name=vpc-id,Values=$vpcId" --query "Subnets[].SubnetId" --output text 2>&1
        if ($LASTEXITCODE -eq 0 -and $subnets -and $subnets -ne "None") {
            foreach ($subnet in ($subnets -split '\s+')) {
                if ($subnet -match '^\s*$') { continue }
                Run-AWS "ec2 delete-subnet --subnet-id $subnet --region $Region" "Deleting subnet: $subnet"
            }
        }
        
        # Delete Route Tables (non-main)
        $rtbs = aws ec2 describe-route-tables --region $Region --filters "Name=vpc-id,Values=$vpcId" --query "RouteTables[?Associations[0].Main==\`false\` || !Associations].RouteTableId" --output text 2>&1
        if ($LASTEXITCODE -eq 0 -and $rtbs -and $rtbs -ne "None") {
            foreach ($rtb in ($rtbs -split '\s+')) {
                if ($rtb -match '^\s*$') { continue }
                Run-AWS "ec2 delete-route-table --route-table-id $rtb --region $Region" "Deleting route table: $rtb"
            }
        }
        
        # Delete Security Groups (non-default)
        $sgs = aws ec2 describe-security-groups --region $Region --filters "Name=vpc-id,Values=$vpcId" --query "SecurityGroups[?GroupName!='default'].GroupId" --output text 2>&1
        if ($LASTEXITCODE -eq 0 -and $sgs -and $sgs -ne "None") {
            foreach ($sg in ($sgs -split '\s+')) {
                if ($sg -match '^\s*$') { continue }
                Run-AWS "ec2 delete-security-group --group-id $sg --region $Region" "Deleting security group: $sg"
            }
        }
        
        # Delete VPC last
        Run-AWS "ec2 delete-vpc --vpc-id $vpcId --region $Region" "Deleting VPC: $vpcId"
    } else {
        Write-Host "  No project-sentinel VPC found (no eksctl tag)." -ForegroundColor Yellow
    }
}

# ─── 6. Delete KMS Keys ──────────────────────────────────────────────────
if (Confirm-Step "Step 6/8: Schedule KMS key deletion") {
    $kmsKeys = aws kms list-keys --region $Region --query "Keys[].KeyId" --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $kmsKeys -and $kmsKeys -ne "None") {
        foreach ($keyId in ($kmsKeys -split '\s+')) {
            if ($keyId -match '^\s*$') { continue }
            $aliases = aws kms list-aliases --key-id $keyId --region $Region --query "Aliases[?contains(AliasName,'sentinel') || contains(AliasName,'project')].AliasName" --output text 2>&1
            if ($LASTEXITCODE -eq 0 -and $aliases -and $aliases -ne "None") {
                Run-AWS "kms schedule-key-deletion --key-id $keyId --pending-window-in-days 7 --region $Region" "Scheduling KMS key deletion: $keyId"
            }
        }
    }
}

# ─── 7. Delete CloudWatch Log Groups ────────────────────────────────────
if (Confirm-Step "Step 7/8: Delete CloudWatch log groups") {
    $logGroups = aws logs describe-log-groups --region $Region --query "logGroups[].logGroupName" --output text 2>&1
    if ($LASTEXITCODE -eq 0 -and $logGroups -and $logGroups -ne "None") {
        foreach ($lg in ($logGroups -split '\s+')) {
            if ($lg -match '^\s*$') { continue }
            if ($lg -match "$ClusterName|sentinel|project") {
                Run-AWS "logs delete-log-group --log-group-name $lg --region $Region" "Deleting log group: $lg"
            }
        }
    }
}

# ─── 8. Clean up kubectl config ──────────────────────────────────────────
if (Confirm-Step "Step 8/8: Remove cluster from kubectl config") {
    kubectl config delete-context "arn:aws:eks:us-east-1:${AccountId}:cluster/${ClusterName}" 2>$null
    kubectl config delete-cluster "arn:aws:eks:us-east-1:${AccountId}:cluster/${ClusterName}" 2>$null
    kubectl config unset "users.arn:aws:eks:us-east-1:${AccountId}:cluster/${ClusterName}" 2>$null
    Write-Host "  -> Removed kubectl entries for $ClusterName" -ForegroundColor Cyan
}

# ─── Summary ─────────────────────────────────────────────────────────────
Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "  Cleanup Complete" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "`nPost-cleanup verification commands:" -ForegroundColor Cyan
Write-Host "  aws eks list-clusters --region $Region" -ForegroundColor Gray
Write-Host "  aws ec2 describe-vpcs --region $Region" -ForegroundColor Gray