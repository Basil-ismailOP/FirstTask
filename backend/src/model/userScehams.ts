import { createPostSchema } from "./postSchemas";
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email("This should be a valid email"),
  username: z.string("Enter a valid Username").min(1, "Enter a valid Username"),
});

export const updateUserSchema = z.object({
  email: z.email("This should be a valid email").optional(),
  username: z
    .string("Enter a valid username")
    .min(1, "Enter a valid username")
    .optional(),
});
