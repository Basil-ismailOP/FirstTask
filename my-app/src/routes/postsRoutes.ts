import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
export type Posts = {
  id: number;
  content: string;
  title: string;
};

export const dummyPosts: Posts[] = [
  { id: 1, content: "This is wonderful!", title: "Wonderland" },
];

export const createPostSchema = z.object({
  title: z.string("Title should be a string"),
  content: z.string("Content should be a string"),
});

export const postsRoutes = new Hono()
  .get("/", (c) => {
    return c.json({ posts: [] });
  })
  .post("/", zValidator("json", createPostSchema), (c) => {
    const data = c.req.valid("json");
    console.log(data);
    return c.json(data);
  });

/**
 *
 *
 * Todo:
 * 1- Route to post,
 * 2- Route to delete
 * 3- Route to modify
 * 4- Route to get a specifc post
 * 5- Route to get all posts
 */
