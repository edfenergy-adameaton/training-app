terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.14.1"
    }
    archive = {
      source  = "hashicorp/archive" // used to make .zip or .tar files within terraform.
      version = "~> 2.4"
    }
    null = {
      source  = "hashicorp/null"    // used to run local commands within terraform
      version = "~> 3.2"
    }
  }
}

provider "aws" {
  # Configuration options
  region = "eu-west-1"
}
