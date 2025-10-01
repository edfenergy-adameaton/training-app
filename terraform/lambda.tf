# Create IAM Role for Lambda Function
# This role defines what permissions our Lambda function will have

resource "aws_iam_role" "database_lambda_role" {
  name = "user_database_lambda_role"

  # This policy allows Lambda service to "assume" this role
  # Think of it like giving Lambda permission to wear this role's "uniform"
  # specifies who can assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17" # fixed date so do not change this
    Statement = [
      {
        Action = "sts:AssumeRole" # allowing the action of assuming this IAM role
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com" # Only Lambda can use this role
        }
      }
    ]
  })

  tags = {
    Purpose = "Database operations for user data"
  }
}

# Attach permissions to the IAM role
# This defines exactly what the Lambda function can do
resource "aws_iam_role_policy" "lambda_database_policy" {
  name = "lambda_database_access_policy"
  role = aws_iam_role.database_lambda_role.id

  # Define the specific permissions
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Allow Lambda to write logs (for debugging and monitoring)
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        # Allow Lambda to read and write ONLY the database file
        Effect = "Allow"
        Action = [
          "s3:GetObject", # Read the database file
          "s3:PutObject"  # Write/update the database file
        ]
        Resource = "arn:aws:s3:::${var.bucket_name}/database/users.json"
      }
    ]
  })
}

# Create the Lambda Function
# First, we need to build TypeScript and package into a ZIP file
# null resource allows you to execute arbitrary commands without actually being any infrastructure.
resource "null_resource" "build_lambda" {
  # Rebuild whenever the TypeScript file or build configuration changes
  triggers = {
    typescript_content = filemd5("${path.module}/lambda_function.ts") # uses md5 hashes to detect changes
    package_json       = filemd5("${path.module}/package.json")
    tsconfig           = filemd5("${path.module}/tsconfig.json")
    build_script       = filemd5("${path.module}/build.sh")
  }

  # Run our build script to compile TypeScript to JavaScript
  # local-exec means it is executed on the local device, not the cloud
  provisioner "local-exec" {
    command = "cd ${path.module} && ./build.sh" #- if any is different it triggers a build
  }
}

# Reference the built ZIP file created by our build script
data "archive_file" "lambda_zip" {
  depends_on = [null_resource.build_lambda]

  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  # The build script creates the ZIP file, so we just reference it
  source_dir = "${path.module}/dist"
}

# Now create the actual Lambda function
resource "aws_lambda_function" "database_api" {
  # Basic configuration
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "user_database_api" # name of the lambda function as it appears in aws
  role          = aws_iam_role.database_lambda_role.arn
  handler       = "index.handler" # Calls the 'handler' function in index.js
  # tells the lambda which function inside the code to run as an entry point

  # Technical settings
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x" # JavaScript runtime version
  timeout          = 30           # Maximum 30 seconds to run - if promises are not resolved, will kill the lambda

  # Environment variables (accessible in our JavaScript code)
  environment {
    variables = {
      S3_BUCKET   = var.bucket_name                                      # Which S3 bucket to use - this is the unique aws name
      DB_KEY      = "database/users.json"                                # Which file in the bucket
      CORS_ORIGIN = "https://edfenergy-adameaton.github.io/training-app" # Allowed CORS origin
    }
  }

  tags = {
    Purpose = "User database operations"
  }
}
