variable "bucket_name" {
  description = "The name for the S3 bucket"
  type        = string
  default     = "adam-app-bucket2909"
}

variable "read_principal_arn" {
  description = "ARN of the IAM user or role that can read from the bucket"
  type        = string
}

variable "write_prinicpal_arn" {
  description = "ARN of the IAM user or roe that can write to the write_prefix"
  type        = string
}

variable "write_prefix" {
  description = "The folder in the bucket where writing is allowed"
  type        = string
  default     = "database/"
}


