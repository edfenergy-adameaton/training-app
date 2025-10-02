import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { S3 } from "aws-sdk";

// Initialize S3 client
const s3 = new S3({ region: process.env.AWS_REGION });

// CORS configuration - only allow to my website
const ALLOWED_ORIGIN =
  process.env.CORS_ORIGIN || "https://edfenergy-adameaton.github.io";

interface ImageUrlsResponse {
  imageUrls: Record<string, string>; // note that record is better then map since it supports bracket and dot notation
  expiresIn: number;
}

// Lambda function to generate pre-signed URLs for images
// Security: Only generates URLs for image files, validates origin

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // APIGatewayProxyResult returns a statusCode and a body

  // CORS headers - what domains, methods and headers are allowerd to access this endpoint.
  const headers = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN, // what domain is allowed to make requests
    "Access-Control-Allow-Headers": "Content-Type", //which client headers are allowed
    "Access-Control-Allow-Methods": "GET, OPTIONS", // which HTTP methods are allowed
    "Access-Control-Allow-Credentials": "false", // whether credentials can be sent
  };

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    console.log("Generating pre-signed URLs for images");

    // List of images in your app (you can make this dynamic if needed)
    const imageKeys = [
      "chess.png",
      "frog.png",
      // yet to add the other files
    ];

    const bucketName = process.env.S3_BUCKET;
    if (!bucketName) {
      throw new Error("S3_BUCKET environment variable not set");
    }

    // Generate pre-signed URLs for each image
    const imageUrls: Record<string, string> = {};
    const expirationTime = 3600; // 1 hour in seconds

    for (const imageKey of imageKeys) {
      try {
        // Generate pre-signed URL for this image
        const signedUrl = s3.getSignedUrl("getObject", {
          Bucket: bucketName,
          Key: imageKey,
          Expires: expirationTime,
        });

        imageUrls[imageKey] = signedUrl;
        console.log(`Generated signed URL for ${imageKey}`);
      } catch (error) {
        console.error(`Failed to generate signed URL for ${imageKey}:`, error);
        // Continue with other images if one fails
      }
    }

    const response: ImageUrlsResponse = {
      imageUrls,
      expiresIn: expirationTime,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error generating image URLs:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to generate image URLs",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
