// setup raw bucket
resource "aws_s3_bucket" "bucket1" {
  bucket = var.bucket_name
}

// block public access
resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.bucket1.id

  block_public_acls   = true // (access control list) - prevents public acls from being added
  block_public_policy = true // prevents bucket poclices from being added that make the bucket public
  // but does not block any policy from allowing specific aws access (like below)
  ignore_public_acls      = true // if there are any existing acls, they are ignored
  restrict_public_buckets = true //only allow access to bucket if request comes from bucket owner or authorized user (failsafe)
}

// create the policy, 
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.bucket1.id
  policy = data.aws_iam_policy_document.specific_access.json
}


resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.bucket1.id
  policy = data.aws_iam_policy_document.website_access.json
}

data "aws_iam_policy_document" "website_access" {
  statement {
    sid = "AllowReadAll"

    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::123456789012:role/WebsiteAccessRole"] // so do i change this to the website name?
    }

    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]

    resources = [
      "arn:aws:s3:::${var.bucket_name}",   # ListBucket operates at bucket level
      "arn:aws:s3:::${var.bucket_name}/*", # GetObject for any object
    ]
  }

  statement {
    sid = "AllowWriteToDatabase"

    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::123456789012:role/WebsiteAccessRole"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "arn:aws:s3:::${var.bucket_name}/database/*", # Only allow writes inside database/
    ]
  }
}
