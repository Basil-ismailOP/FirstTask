import "dotenv/config";
import { S3Client, s3 } from "bun";

export const client = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  bucket: process.env.S3_BUCKET!,
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
});
export const BUCKET_NAME = process.env.S3_BUCKET || "dummy";
