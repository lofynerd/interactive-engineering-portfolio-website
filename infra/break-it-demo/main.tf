terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# The WAFv2 Web ACL for a regional resource (API Gateway) must be created in
# the same region as that resource, so a single provider is sufficient here
# (unlike the CloudFront use case, which requires us-east-1).
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "portfolio-break-it-demo"
      Environment = "demo"
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "break-it-demo"
}
