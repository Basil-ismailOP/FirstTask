import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string("Title should be a string"),
  content: z.string("Content should be a string"),
});

export const updatePostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  image: z
    .instanceof(File)
    .refine(
      (files) => files.size <= 5000000,
      "File Size should be less than 5MB"
    )
    .refine((file) => ["image/png"].includes(file.type), "Only PNG allowed")
    .optional(),
});
