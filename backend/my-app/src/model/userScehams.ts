import { createPostSchema } from "./postSchemas";
import { z } from "zod/v4";

export const createUserSchema = z.object({
  email: z.email("This should be a valid email"),
  username: z.string("Enter a valid Username"),
});

export const updateUserSchema = z.object({
  email: z.email("This should be a valid email").optional(),
  username: z.string("Enter a valid username").optional(),
});
