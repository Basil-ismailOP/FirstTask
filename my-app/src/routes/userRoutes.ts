import { Hono } from "hono";
import { Posts, dummyPosts, createPostSchema } from "./postsRoutes";
import { email, z } from "zod";
type User = {
  email: string;
  username: string;
  posts: Posts[];
};

const createUserSchema = z.object({
  email: z.email("This should be a valid email"),
  username: z.string("Enter a valid Username"),
  posts: z.array(createPostSchema),
});
const dummydata: User[] = [
  { email: "Basilawni123@gmail.com ", username: "Basil", posts: dummyPosts },
];

export const userRoutes = new Hono()
  .get("/", (c) => {
    return c.json({ users: [] });
  })
  .post("/", (c) => {
    return c.json({});
  });

/**
 * Todo:
 * 1- Route to Create a user
 * 2- Route to modify user's info
 * 3- Route to get user's Posts
 * 4- Rotue to Delete user
 *
 */
