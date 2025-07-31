import { minioClient, BUCKET_NAME } from "./minio";
import { v4 as uuidv4 } from "uuid";

export const getImageUrl = async (key: string): Promise<string> => {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      key,
      24 * 60 * 60
    );
    return url;
  } catch (error) {
    return "";
  }
};
export const uploadImageToMinio = async (
  file: File
): Promise<{ uniqueKey: string; url: string }> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const uniqueKey = `images/${uuidv4()}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await minioClient.putObject(BUCKET_NAME, uniqueKey, buffer, file.size, {
      "Content-Type": file.type,
    });
    const url = await getImageUrl(uniqueKey);
    return { uniqueKey, url };
  } catch (error) {
    console.error(`Error uplodaing image: ${error}`);
    throw new Error("Failed to upload Image");
  }
};

export const deleteImageFromMinio = async (
  imageKey: string
): Promise<string | null> => {
  try {
    if (imageKey) {
      await minioClient.removeObject(BUCKET_NAME, imageKey);
      console.log(`Successfully deleted image: ${imageKey}`);
    }
    return null;
  } catch (error) {
    return `Error deleting image: ${error}`;
    throw new Error("Couldn't delete an image " + error);
  }
};
