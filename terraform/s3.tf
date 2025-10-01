// setup raw bucket
resource "aws_s3_bucket" "bucket1" {
  bucket = var.bucket_name
}

// can upload files to an S3 with aws_s3_object
resource "aws_s3_object" "example_file" {
  bucket   = aws_s3_bucket.bucket1.id
  for_each = var.files_to_upload
  key      = each.key
  source   = each.value
  content_type = lookup({ // maps files to their proper file type
    "jpg"  = "image/jpeg"
    "jpeg" = "image/jpeg"
    "png"  = "image/png"
    "gif"  = "image/gif"
    "svg"  = "image/svg+xml"
  }, lower(split(".", each.key)[length(split(".", each.key)) - 1]), "application/octet-stream")
}

//Block public access except for controlled access via policy
resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.bucket1.id

  block_public_acls       = true // Block public ACLs
  block_public_policy     = true // block any public policies
  ignore_public_acls      = true // Ignore any public ACLs
  restrict_public_buckets = true // block any public access in general
}

// create the policy
# Create an empty database file in S3
# This JSON file will store our user data with the required columns
resource "aws_s3_object" "users_database" {
  bucket = aws_s3_bucket.bucket1.id
  key    = "database/users.json"

  # Initial empty database with schema definition
  content = jsonencode({
    users = []
    schema = {
      firstName       = "string - User's first name"
      surname         = "string - User's last name"
      birthday        = "string - User's birthday (YYYY-MM-DD format)"
      favouriteColour = "string - User's favourite color"
      favouriteNumber = "number - User's favourite number (SENSITIVE - never expose via API)"
    }
    created_at = "2025-09-30T10:00:00Z"
  })

  content_type = "application/json"
}


