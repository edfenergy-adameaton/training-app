// STEP 3: Lambda Function Code (TypeScript)
// This code runs in AWS Lambda to handle database operations

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { S3 } from "aws-sdk"; // imports the aws sdk, which allows the lambda to interact with AWS services

// Initialize S3 client
const s3 = new S3(); // creates an S3 client object using AWS SDK. allows options like getObject and putObject

// Get configuration from environment variables (set by Terraform)
const BUCKET_NAME = process.env.S3_BUCKET!; // s3 bucket name
const DB_KEY = process.env.DB_KEY!; // path to file
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN!; // allowed CORS origin

// Type definitions for our database schema
interface User {
  id: string;
  firstName: string;
  surname: string;
  birthday: string;
  favouriteColour: string;
  favouriteNumber: number;
  createdAt: string;
}

// this is like what is defined in the s3.tf - what will be found in the database?
// why is it not the same as the entries above?
interface Database {
  users: User[];
  schema?: {
    firstName: string;
    surname: string;
    birthday: string;
    favouriteColour: string;
    favouriteNumber: string;
  };
  created_at?: string;
}

interface SafeUser {
  id: string;
  firstName: string;
  surname: string;
  birthday: string;
  favouriteColour: string;
  // favouriteNumber intentionally omitted for security
}

interface UserInput {
  firstName: string;
  surname: string;
  birthday: string;
  favouriteColour: string;
  favouriteNumber: number;
}

// Main handler function - this is called when API requests come in
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // event contains details about the http request
  // stringify converts event into a formatted json string (null: not applying any special replacer function, 2: indent with 2 spaces)
  console.log("Incoming request:", JSON.stringify(event, null, 2));

  const method = event.httpMethod; // GET, POST, etc.
  const path = event.path; // /users, etc. This is the url path of the HTTP request.

  // CORS headers to allow ONLY your React app to call this API - allows http requests from browser
  // when frontend tries to call backend lambda, CORS rules apply
  const headers = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN, // SECURE: Only allows your specific domain
    "Access-Control-Allow-Headers": "Content-Type", // tells the browser it is okay for the request to include content type as a header  
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // tells browsers what http methods are allowed. options is a check to see what is allowed
    "Access-Control-Allow-Credentials": "false", // SECURITY: Don't allow credentials to be sent
  };

  // use POST rather then PUT since we are effectively adding a user to the database

  try {
    // Handle preflight requests (browser security check) - browser send options requests to check if the request is safe to send.
    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }

    // Route to different functions based on the request
    if (path === "/users" && method === "GET") {
      return await getUsers(headers); // passes on the headers object
    }

    if (path === "/users" && method === "POST") {
      return await addUser(event, headers);
    }

    // If no route matches, return 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Endpoint not found" }),
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// Function to get users (WITHOUT sensitive favourite number)
async function getUsers(
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    console.log("Getting users from S3...");

    // Read the database file from S3
    const data = await s3 // creates a request object to get an object (file) from the s3 bucket
      .getObject({
        Bucket: BUCKET_NAME,
        Key: DB_KEY,
      })
      .promise();

    // can use promise and await / async
    // promise represents a task that will complete in the future. promise to either resolve it or reject it.
    // async marks a function that will alwasy return a promise
    // await pauses execution inside async function until promise resolves or rejects.

    // Parse the JSON data
    // even though data is saved as a json in the S3 file, the data.Body will jsut be the raw bytes so we need to convert back into json text
    // to string converts the bytes to a string, and then parse creates a javascript object
    const database: Database = JSON.parse(
      data.Body?.toString() || '{"users":[]}'
    );

    // Return users WITHOUT the favourite number (for security)
    // create a new json that does not include the favourite number
    // need to do .users since the database can also include other information like lastUpdated and version (in the main.tf where we created the database)
    const safeUsers: SafeUser[] = database.users.map((user: User) => ({
      id: user.id,
      firstName: user.firstName,
      surname: user.surname,
      birthday: user.birthday,
      favouriteColour: user.favouriteColour,
      // favouriteNumber is intentionally omitted
    }));

    console.log(`Returning ${safeUsers.length} users (without sensitive data)`);

    return {
      statusCode: 200, // everythin is okay
      headers,
      body: JSON.stringify({
        users: safeUsers,
        count: safeUsers.length,
      }),
    };
  } catch (error: any) {
    if (error.code === "NoSuchKey") {
      console.log("Database file not found, returning empty array");
      return {
        statusCode: 200, // why not an error here?
        headers,
        body: JSON.stringify({ users: [], count: 0 }),
      };
    }
    throw error;
  }
}

// Function to add a new user
async function addUser(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  console.log("Adding new user...");

  // Parse the request body
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Request body is required" }),
    };
  }

  const userData: UserInput = JSON.parse(event.body);

  // Validate all required fields are present
  const requiredFields: (keyof UserInput)[] = [
    "firstName",
    "surname",
    "birthday",
    "favouriteColour",
    "favouriteNumber",
  ];
  for (const field of requiredFields) {
    if (!userData[field]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Missing required field: ${field}`,
          requiredFields: requiredFields,
        }),
      };
    }
  }

  try {
    // Get existing database or create empty one
    let database: Database = { users: [] };
    try {
      const data = await s3
        .getObject({
          Bucket: BUCKET_NAME,
          Key: DB_KEY,
        })
        .promise();
      database = JSON.parse(data.Body?.toString() || '{"users":[]}');
    } catch (error: any) {
      if (error.code !== "NoSuchKey") {
        throw error;
      }
      console.log("Database file not found, creating new one");
    }

    // Create new user record
    const newUser: User = {
      id: Date.now().toString(), // Simple ID generation
      firstName: userData.firstName,
      surname: userData.surname,
      birthday: userData.birthday,
      favouriteColour: userData.favouriteColour,
      favouriteNumber: userData.favouriteNumber, // Stored but never returned
      createdAt: new Date().toISOString(),
    };

    // Add to database
    database.users.push(newUser);

    console.log(`Adding user: ${newUser.firstName} ${newUser.surname}`);

    // Save back to S3
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: DB_KEY,
        Body: JSON.stringify(database, null, 2),
        ContentType: "application/json",
      })
      .promise();

    console.log("User saved successfully");

    // Return success (without sensitive data)
    const safeUser: SafeUser = {
      id: newUser.id,
      firstName: newUser.firstName,
      surname: newUser.surname,
      birthday: newUser.birthday,
      favouriteColour: newUser.favouriteColour,
      // favouriteNumber omitted from response
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "User added successfully",
        user: safeUser,
      }),
    };
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}
