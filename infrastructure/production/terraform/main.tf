# Terraform Configuration for Scribe Tree Production Environment
# Privacy-Enhanced Infrastructure as Code

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  backend "s3" {
    bucket         = "scribe-tree-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT:key/terraform-state-key"
    dynamodb_table = "scribe-tree-terraform-locks"
  }
}

# Provider configurations
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment         = "production"
      Project            = "scribe-tree"
      PrivacyLevel       = "high"
      ComplianceScope    = "ferpa-gdpr-coppa"
      DataClassification = "sensitive-educational"
      ManagedBy          = "terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for primary deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "privacy_compliance_level" {
  description = "Privacy compliance level for data handling"
  type        = string
  default     = "strict"
  validation {
    condition     = contains(["standard", "strict", "maximum"], var.privacy_compliance_level)
    error_message = "Privacy compliance level must be standard, strict, or maximum."
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# KMS Keys for Privacy Encryption
resource "aws_kms_key" "privacy_encryption" {
  description             = "KMS key for Scribe Tree privacy data encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Scribe Tree Services"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.eks_privacy_role.arn,
            aws_iam_role.rds_privacy_role.arn
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "scribe-tree-privacy-encryption"
    Purpose     = "privacy-data-protection"
    Compliance  = "ferpa-gdpr-coppa"
  }
}

resource "aws_kms_alias" "privacy_encryption" {
  name          = "alias/scribe-tree-privacy"
  target_key_id = aws_kms_key.privacy_encryption.key_id
}

# VPC for Privacy-Aware Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                = "scribe-tree-vpc"
    PrivacyLevel       = "high"
    DataResidency      = var.aws_region
    ComplianceScope    = "ferpa-gdpr"
  }
}

# Private subnets for sensitive workloads
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                     = "scribe-tree-private-${count.index + 1}"
    Type                     = "private"
    PrivacyLevel            = "high"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# Public subnets for load balancers
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                     = "scribe-tree-public-${count.index + 1}"
    Type                     = "public"
    PrivacyLevel            = "standard"
    "kubernetes.io/role/elb" = "1"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "scribe-tree-igw"
  }
}

# NAT Gateways for private subnet internet access
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "scribe-tree-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "scribe-tree-nat-${count.index + 1}"
  }
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "scribe-tree-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "scribe-tree-private-rt-${count.index + 1}"
  }
}

# Route table associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "privacy_services" {
  name_prefix = "scribe-tree-privacy-services-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for privacy-sensitive services"

  # Inbound rules
  ingress {
    description = "HTTPS from load balancer"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Internal service communication"
    from_port   = 8080
    to_port     = 8090
    protocol    = "tcp"
    self        = true
  }

  # Outbound rules
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name         = "scribe-tree-privacy-services"
    PrivacyLevel = "high"
    Purpose      = "privacy-sensitive-workloads"
  }
}

resource "aws_security_group" "alb" {
  name_prefix = "scribe-tree-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "scribe-tree-alb"
  }
}

# RDS Subnet Group for Privacy-Aware Database
resource "aws_db_subnet_group" "privacy" {
  name       = "scribe-tree-privacy-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name         = "scribe-tree-privacy-db-subnet-group"
    PrivacyLevel = "high"
    Purpose      = "privacy-data-storage"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "scribe-tree-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS instances"

  ingress {
    description     = "PostgreSQL from privacy services"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.privacy_services.id]
  }

  tags = {
    Name         = "scribe-tree-rds"
    PrivacyLevel = "high"
  }
}

# IAM roles for privacy-aware services
resource "aws_iam_role" "eks_privacy_role" {
  name = "scribe-tree-eks-privacy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Purpose      = "eks-privacy-operations"
    PrivacyLevel = "high"
  }
}

resource "aws_iam_role" "rds_privacy_role" {
  name = "scribe-tree-rds-privacy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Purpose      = "rds-privacy-operations"
    PrivacyLevel = "high"
  }
}

# CloudWatch Log Groups with Privacy Retention
resource "aws_cloudwatch_log_group" "privacy_services" {
  name              = "/aws/scribe-tree/privacy-services"
  retention_in_days = 90  # FERPA compliance retention
  kms_key_id        = aws_kms_key.privacy_encryption.arn

  tags = {
    Environment  = "production"
    PrivacyLevel = "high"
    Compliance   = "ferpa-gdpr"
    Purpose      = "privacy-service-logs"
  }
}

resource "aws_cloudwatch_log_group" "audit_trail" {
  name              = "/aws/scribe-tree/audit-trail"
  retention_in_days = 2555  # 7 years for FERPA
  kms_key_id        = aws_kms_key.privacy_encryption.arn

  tags = {
    Environment = "production"
    Purpose     = "audit-trail"
    Compliance  = "ferpa-gdpr-immutable"
  }
}

# S3 Buckets for Privacy-Compliant Storage
resource "aws_s3_bucket" "privacy_data" {
  bucket = "scribe-tree-privacy-data-${random_string.bucket_suffix.result}"

  tags = {
    Environment     = "production"
    PrivacyLevel   = "high"
    DataType       = "educational-records"
    Compliance     = "ferpa-gdpr-coppa"
  }
}

resource "aws_s3_bucket_encryption" "privacy_data" {
  bucket = aws_s3_bucket.privacy_data.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.privacy_encryption.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_versioning" "privacy_data" {
  bucket = aws_s3_bucket.privacy_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "privacy_data" {
  bucket = aws_s3_bucket.privacy_data.id

  rule {
    id     = "privacy_data_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555  # 7 years FERPA retention
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "privacy_kms_key_id" {
  description = "ID of the privacy encryption KMS key"
  value       = aws_kms_key.privacy_encryption.key_id
  sensitive   = true
}

output "privacy_security_group_id" {
  description = "ID of the privacy services security group"
  value       = aws_security_group.privacy_services.id
}

output "privacy_bucket_name" {
  description = "Name of the privacy data S3 bucket"
  value       = aws_s3_bucket.privacy_data.bucket
  sensitive   = true
}