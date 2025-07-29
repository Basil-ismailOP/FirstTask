import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { dummyPosts } from "../data";
import { createPostSchema, updatePostSchema } from "../model/postSchemas";
import { db } from "../db";
import { postsTable } from "../db/schema";

export type Posts = {
  id: string;
  content: string;
  title: string;
};

export const postsRoutes = new Hono()
  .get("/", async (c) => {
    try {
      const posts = await db.select().from(postsTable);
      return c.json({ posts });
    } catch (e) {
      return c.json({ message: "Failed to fetch posts", error: e }, 500);
    }
  })

  .post(
    "/create-post/:userid",
    zValidator("json", createPostSchema),
    async (c) => {
      try {
      } catch (error) {}
    }
  )

  .patch("/update-post/:id", zValidator("json", updatePostSchema), (c) => {
    const id = c.req.param("id");
    const postModified = c.req.valid("json");
    const post = dummyPosts.find((p) => {
      return p.id === id;
    });
    if (!post) return c.json({ message: "No item with such ID" }, 404);

    if ("content" in postModified)
      post.content = (postModified.content as string) ?? post.content;

    if ("title" in postModified)
      post.title = (postModified.title as string) ?? post.title;

    return c.json(post, 201);
  })

  .delete("/delete-post/:id", (c) => {
    const id = c.req.param("id");
    const index = dummyPosts.findIndex((p) => p.id === id);
    if (!index) return c.json({ message: "no item found" }, 404);

    dummyPosts.splice(index, 1);
    return c.json({ message: "Post deleted Successfully", dummyPosts }, 200);
  });

//   .delete("/delete-post/:id", (c) => {});

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
