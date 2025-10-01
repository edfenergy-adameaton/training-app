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
  content_type = lookup({
    "jpg"  = "image/jpeg"
    "jpeg" = "image/jpeg"
    "png"  = "image/png"
    "gif"  = "image/gif"
    "svg"  = "image/svg+xml"
  }, lower(split(".", each.key)[length(split(".", each.key)) - 1]), "application/octet-stream")
}

// SECURE: Block public access except for controlled access via policy
resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.bucket1.id

  block_public_acls       = true  // Block public ACLs
  block_public_policy     = false // Allow our specific bucket policy
  ignore_public_acls      = true  // Ignore any public ACLs
  restrict_public_buckets = false // Allow our controlled public access
}

// create the policy
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.bucket1.id
  policy = data.aws_iam_policy_document.website_access.json
}

data "aws_iam_policy_document" "website_access" {
  # SECURE: Allow image access ONLY from your specific website
  // is this secure enough or will it still be flagged as public?
  // could also use a lambda, or could use pre-signed urls?
  statement {
    sid = "RestrictedImageAccess"

    effect = "Allow"

    principals { // who this access is given to (in this case any principle of any type has access)
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "arn:aws:s3:::${var.bucket_name}/*.png",
      "arn:aws:s3:::${var.bucket_name}/*.jpg",
      "arn:aws:s3:::${var.bucket_name}/*.jpeg",
      "arn:aws:s3:::${var.bucket_name}/*.gif",
      "arn:aws:s3:::${var.bucket_name}/*.svg"
    ]

    # SECURITY: Only allow access when request comes from your website
    condition {
      test     = "StringLike"
      variable = "aws:Referer"
      values = [
        "https://edfenergy-adameaton.github.io/training-app/*",
        "https://edfenergy-adameaton.github.io/training-app"
      ]
    }
  }

  # EXPLICIT DENY: Block ALL access to database folder from public
  statement {
    sid = "DenyAllDatabaseAccess"

    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]

    resources = [
      "arn:aws:s3:::${var.bucket_name}/database",
      "arn:aws:s3:::${var.bucket_name}/database/*"
    ]
  }
}

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



# Output the S3 bucket URL for use in your React app
// but is this no longer usable since it should be private?
output "s3_bucket_url" {
  value       = "https://${aws_s3_bucket.bucket1.bucket}.s3.${aws_s3_bucket.bucket1.region}.amazonaws.com"
  description = "Base URL for accessing S3 objects"
}

# Output the API Gateway URL for database operations


