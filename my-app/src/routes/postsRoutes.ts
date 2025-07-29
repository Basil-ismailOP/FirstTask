import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createPostSchema, updatePostSchema } from "../model/postSchemas";
import { db } from "../db";
import { postsTable } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const postsRoutes = new Hono()
  .get("/", async (c) => {
    try {
      const posts = await db.select().from(postsTable);
      return c.json({ posts });
    } catch (e) {
      return c.json({ message: "Failed to fetch posts", error: e }, 500);
    }
  })

  .post("/create-post/:id", zValidator("json", createPostSchema), async (c) => {
    try {
      const userId = parseInt(c.req.param("id"));
      if (isNaN(userId)) return c.json({ message: "Not a valid ID" }, 400);
      const postData = c.req.valid("json");
      const newPost = await db
        .insert(postsTable)
        .values({ title: postData.title, content: postData.content, userId })
        .returning();
      return c.json({ message: "Post uploaded Successfully", newPost });
    } catch (error) {
      return c.json({ message: "Something went wrong creating new post" }, 500);
    }
  })

  .patch(
    "/update-post/:userid/:postid",
    zValidator("json", updatePostSchema),
    async (c) => {
      try {
        const userId = parseInt(c.req.param("userid"));
        const postId = parseInt(c.req.param("postid"));

        if (isNaN(userId) || isNaN(postId))
          return c.json({ message: "Invalid credentials" }, 400);

        const updatedPostData = c.req.valid("json");
        const updatePost = await db
          .update(postsTable)
          .set(updatedPostData)
          .where(and(eq(postsTable.userId, userId), eq(postsTable.id, postId)))
          .returning();
        if (!updatePost.length)
          return c.json({ message: "No post found to update" }, 404);
        return c.json({ message: "Post updated Successfully " }, 200);
      } catch (error) {
        return c.json(
          { message: "Something went wrong while updating the post" },
          500
        );
      }
    }
  )
  .delete("/delete-post/:userid/:postid", async (c) => {
    try {
      const userId = parseInt(c.req.param("userid"));
      const postId = parseInt(c.req.param("postid"));

      if (isNaN(postId) || isNaN(userId))
        return c.json({ message: "Invalid Credentials" }, 400);

      const deletedPost = await db
        .delete(postsTable)
        .where(and(eq(postsTable.id, postId), eq(postsTable.userId, userId)))
        .returning();
      if (!deletedPost.length)
        return c.json({ message: "No post found to delete" }, 404);

      return c.json({ message: "Post deleted successfully", deletedPost }, 200);
    } catch (error) {
      return c.json({ message: "Something went wrong" }, 500);
    }
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
