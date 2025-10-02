# Create API Gateway to expose HTTP endpoints
# This creates the main REST API
// acts as a container for the api endpoints
resource "aws_api_gateway_rest_api" "database_api" {
  name        = "user-database-api"
  description = "API for user database operations (secure access to S3)"

  # Configure CORS at API level
  endpoint_configuration {
    types = ["REGIONAL"] # Creates API in a specific AWS region - deployed to and accessible form a specific region
  }
}

# Create a '/users' resource (endpoint path)
// sort of like a folder in the api
resource "aws_api_gateway_resource" "users_resource" {
  rest_api_id = aws_api_gateway_rest_api.database_api.id
  parent_id   = aws_api_gateway_rest_api.database_api.root_resource_id
  path_part   = "users" # This creates the '/users' path
}

# Give API Gateway permission to invoke our Lambda function
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"                        // unique id for thae permisson, like a rule name
  action        = "lambda:InvokeFunction"                        // grants the ability to call the Lambda function
  function_name = aws_lambda_function.database_api.function_name // links to actual lambda function
  principal     = "apigateway.amazonaws.com"                     // tells aws that the api gateway is the caller

  # Allow API Gateway from this specific API to call our Lambda
  source_arn = "${aws_api_gateway_rest_api.database_api.execution_arn}/*/*" // restricts permission to only requests coming form this specific API Gateway instance
}



# GET method for retrieving users
resource "aws_api_gateway_method" "get_users" {
  rest_api_id   = aws_api_gateway_rest_api.database_api.id
  resource_id   = aws_api_gateway_resource.users_resource.id // specifies the api resource that the integration applies to (i.e the users)
  http_method   = "GET"                                      // type of api gateway method
  authorization = "NONE"                                     # No authentication required (public endpoint)
}

# Connect GET method to Lambda function
resource "aws_api_gateway_integration" "get_users_integration" {
  rest_api_id = aws_api_gateway_rest_api.database_api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.get_users.http_method

  integration_http_method = "POST"                                      # Lambda always uses POST - call the backend integration
  type                    = "AWS_PROXY"                                 # Whole HTTP request passed directly to Lambda as event data
  uri                     = aws_lambda_function.database_api.invoke_arn // the arn (Amazon Resource Name) of the lambda function to invoke
}

# POST method for adding users  
resource "aws_api_gateway_method" "post_users" {
  rest_api_id   = aws_api_gateway_rest_api.database_api.id
  resource_id   = aws_api_gateway_resource.users_resource.id
  http_method   = "POST"
  authorization = "NONE" # No authentication required
}

# Connect POST method to Lambda function
resource "aws_api_gateway_integration" "post_users_integration" {
  rest_api_id = aws_api_gateway_rest_api.database_api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.post_users.http_method

  integration_http_method = "POST"      # Lambda always uses POST  
  type                    = "AWS_PROXY" # Pass request directly to Lambda
  uri                     = aws_lambda_function.database_api.invoke_arn
}

# OPTIONS method for CORS (browser security requirement)
resource "aws_api_gateway_method" "options_users" {
  rest_api_id   = aws_api_gateway_rest_api.database_api.id
  resource_id   = aws_api_gateway_resource.users_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Handle OPTIONS method for CORS
resource "aws_api_gateway_integration" "options_users_integration" {
  rest_api_id = aws_api_gateway_rest_api.database_api.id
  resource_id = aws_api_gateway_resource.users_resource.id
  http_method = aws_api_gateway_method.options_users.http_method

  type = "MOCK" # No backend needed (do not forward to the backend), just return CORS headers

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# API Gateway for image URL generation
resource "aws_api_gateway_resource" "images" {
  rest_api_id = aws_api_gateway_rest_api.database_api.id
  parent_id   = aws_api_gateway_rest_api.database_api.root_resource_id
  path_part   = "images"
}

# Permission for API Gateway to invoke image Lambda
resource "aws_lambda_permission" "allow_api_gateway_images" {
  statement_id  = "AllowAPIGatewayInvokeImages"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_urls.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.database_api.execution_arn}/*/*"
}

resource "aws_api_gateway_method" "images_get" {
  rest_api_id   = aws_api_gateway_rest_api.database_api.id
  resource_id   = aws_api_gateway_resource.images.id
  http_method   = "GET"
  authorization = "NONE"
}

# Integration for GET /images
resource "aws_api_gateway_integration" "images_integration" {
  rest_api_id = aws_api_gateway_rest_api.database_api.id
  resource_id = aws_api_gateway_resource.images.id
  http_method = aws_api_gateway_method.images_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.image_urls.invoke_arn
}

resource "aws_api_gateway_method" "images_options" {
  rest_api_id   = aws_api_gateway_rest_api.database_api.id
  resource_id   = aws_api_gateway_resource.images.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integration for OPTIONS /images (CORS)
resource "aws_api_gateway_integration" "images_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.database_api.id
  resource_id = aws_api_gateway_resource.images.id
  http_method = aws_api_gateway_method.images_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.image_urls.invoke_arn
}



# Deploy the API (make it live)
// becomes active and accessible via a URL
resource "aws_api_gateway_deployment" "api_deployment" {
  # Wait for all integrations to be created first - before deploying
  depends_on = [
    aws_api_gateway_integration.get_users_integration,
    aws_api_gateway_integration.post_users_integration,
    aws_api_gateway_integration.options_users_integration,
    aws_api_gateway_integration.images_integration,
    aws_api_gateway_integration.images_options_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.database_api.id // connects deployment to the rest api
}

# Create a 'production' stage for the API
// needs a named stage or the API isn't available 
resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.database_api.id
  stage_name    = "prod"
}

output "api_gateway_url" {
  value       = "https://${aws_api_gateway_rest_api.database_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
  description = "API Gateway URL for database operations"
}
