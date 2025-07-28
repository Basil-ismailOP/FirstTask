import { Hono } from "hono";
import { Posts } from "./postsRoutes";
import { createPostSchema } from "../model/userSchemas";
import { email, z } from "zod";
import { dummyData, dummyPosts } from "../data";
import { zValidator } from "@hono/zod-validator";

export type User = {
  email: string;
  username: string;
  posts: Posts[];
};

const createUserSchema = z.object({
  email: z.email("This should be a valid email"),
  username: z.string("Enter a valid Username"),
  posts: z.array(createPostSchema).optional(),
});

export const userRoutes = new Hono()
  .get("/", (c) => {
    return c.json({ users: dummyData });
  })
  .post("/createUser", zValidator("json", createUserSchema), (c) => {
    const user = c.req.valid("json");
    dummyData.push({ ...user, posts: [] });
    return c.json(user);
  });

/**
 * Todo:
 * 1- Route to Create a user
 * 2- Route to modify user's info
 * 3- Route to get user's Posts
 * 4- Rotue to Delete user
 *
 */
