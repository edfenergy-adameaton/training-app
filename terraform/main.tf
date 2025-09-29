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

// Allow public access for static assets (images)
resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.bucket1.id

  block_public_acls       = false // Allow public ACLs for images
  block_public_policy     = false // Allow public bucket policy  
  ignore_public_acls      = false // Don't ignore public ACLs
  restrict_public_buckets = false // Allow public bucket access
}

// create the policy
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.bucket1.id
  policy = data.aws_iam_policy_document.website_access.json
}

data "aws_iam_policy_document" "website_access" {
  # Allow public read access to images (for website usage)
  statement {
    sid = "PublicReadForImages"

    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"] // currently don't understand this - is it set to all?
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
  }

  # Allow authenticated access for database operations
  statement {
    sid = "AllowWriteToDatabase"

    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [var.write_prinicpal_arn]
    }

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ]

    resources = [
      "arn:aws:s3:::${var.bucket_name}/database/*"
    ]
  }
}

# Output the S3 bucket URL for use in your React app
output "s3_bucket_url" {
  value       = "https://${aws_s3_bucket.bucket1.bucket}.s3.${aws_s3_bucket.bucket1.region}.amazonaws.com"
  description = "Base URL for accessing S3 objects"
}


