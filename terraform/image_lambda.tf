# IAM role for image Lambda function
resource "aws_iam_role" "image_lambda_role" {
  name = "image_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for image Lambda - only read access to images
resource "aws_iam_role_policy" "image_lambda_policy" {
  name = "image_lambda_policy"
  role = aws_iam_role.image_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.bucket_name}/*.png",
          "arn:aws:s3:::${var.bucket_name}/*.jpg",
          "arn:aws:s3:::${var.bucket_name}/*.jpeg",
          "arn:aws:s3:::${var.bucket_name}/*.gif",
          "arn:aws:s3:::${var.bucket_name}/*.svg"
        ]
      }
    ]
  })
}

# Build the TypeScript image Lambda function
resource "null_resource" "build_image_lambda" {
  triggers = {
    typescript_content = filemd5("${path.module}/image_lambda.ts")
    package_json       = filemd5("${path.module}/package.json")
    tsconfig           = filemd5("${path.module}/tsconfig.json")
    build_script       = filemd5("${path.module}/build_image.sh")
  }

  provisioner "local-exec" {
    command = "cd ${path.module} && ./build_image.sh"
  }
}

# Create ZIP file for image Lambda deployment
data "archive_file" "image_lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/image_lambda.zip"
  source_dir  = "${path.module}/image_dist"

  depends_on = [null_resource.build_image_lambda]
}





# Lambda function for generating image URLs
resource "aws_lambda_function" "image_urls" {
  filename         = data.archive_file.image_lambda_zip.output_path
  function_name    = "generate-image-urls"
  role             = aws_iam_role.image_lambda_role.arn
  handler          = "image_lambda.handler"
  source_code_hash = data.archive_file.image_lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      S3_BUCKET   = var.bucket_name
      CORS_ORIGIN = "https://edfenergy-adameaton.github.io"
    }
  }

  depends_on = [
    aws_iam_role_policy.image_lambda_policy,
    data.archive_file.image_lambda_zip,
  ]
}













