import { client, BUCKET_NAME } from "./minio";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

const S3_ENDPOINT = process.env.S3_ENDPOINT;

export function getImageUrl(
  key: string,
  expiresInSeconds = 24 * 60 * 60
): string {
  try {
    return client.presign(key, { expiresIn: expiresInSeconds });
  } catch {
    return "";
  }
}

export const uploadImageToMinio = async (
  file: File
): Promise<{ uniqueKey: string; url: string }> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const uniqueKey = `images/${uuidv4()}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await client.write(uniqueKey, buffer, {
      bucket: BUCKET_NAME,
      type: file.type,
    });
    const url = await getImageUrl(uniqueKey);
    return { uniqueKey, url };
  } catch (error) {
    console.error(`Error uploading image: ${error}`);
    throw new Error("Failed to upload Image");
  }
};

export const deleteImageFromMinio = async (
  imageKey: string
): Promise<string | null> => {
  if (!imageKey) {
    return null;
  }

  try {
    await client.delete(imageKey);
    console.log(`Successfully deleted image: ${imageKey}`);
    return null;
  } catch (err: any) {
    console.error(`Error deleting image:`, err);
    return `Error deleting image: ${err.message ?? err}`;
  }
};
