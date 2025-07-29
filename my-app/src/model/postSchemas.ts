import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string("Title should be a string"),
  content: z.string("Content should be a string"),
});

export const updatePostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});
