import { minioClient, BUCKET_NAME } from "./minio";
import { v4 as uuidv4 } from "uuid";

export const uploadImageToMinio = async (file: File): Promise<string> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const fileName = `newnaem.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await minioClient.putObject(BUCKET_NAME, fileName, buffer, file.size, {
      "Content-Type": file.type,
    });
    return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;
  } catch (error) {
    console.error(`Error uplodaing image: ${error}`);
    throw new Error("Failed to upload Image");
  }
};

export const deleteImageFromMinio = async (imageUrl: string): Promise<void> => {
  try {
    const filename = imageUrl.split("/").pop();
    if (filename) {
      await minioClient.removeObject(BUCKET_NAME, filename);
    }
  } catch (error) {
    console.error("Error deleting image: ", error);
  }
};
