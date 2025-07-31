import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createPostSchema, updatePostSchema } from "../model/postSchemas";
import { db } from "../db";
import { postsTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import {
  uploadImageToMinio,
  deleteImageFromMinio,
  getImageUrl,
} from "../minioHelpers";
import { initializeBucket } from "../minio";

initializeBucket();
export const postsRoutes = new Hono()
  .get("/", async (c) => {
    try {
      const posts = await db.select().from(postsTable);
      return c.json({ posts });
    } catch (e) {
      return c.json({ message: "Failed to fetch posts", error: e }, 500);
    }
  })
  .get("/get-post/:userid/:postid", async (c) => {
    try {
      const userid = parseInt(c.req.param("userid"));
      const postid = parseInt(c.req.param("postid"));

      if (isNaN(userid) || isNaN(postid))
        return c.json({ message: "Invalid IDs" }, 400);
      const post = await db
        .select()
        .from(postsTable)
        .where(and(eq(postsTable.userId, userid), eq(postsTable.id, postid)));
      if (!post.length) return c.json({ message: "No post found" }, 404);
      if (post[0].imageKey)
        post[0].imageKey = await getImageUrl(post[0].imageKey);
      return c.json({ post });
    } catch (error) {
      return c.json({ message: "Something went wrong" }, 500);
    }
  })
  .get("/get-posts/:userid", async (c) => {
    try {
      const userId = parseInt(c.req.param("userid"));
      if (isNaN(userId)) return c.json({ message: "Invalid ID" }, 400);
      const posts = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.userId, userId));
      if (!posts.length)
        return c.json({ message: "No posts found for this user" });
      for (let post of posts) {
        let imageUrl: string | null = null;
        if (post.imageKey) imageUrl = await getImageUrl(post.imageKey);
        post.imageKey = imageUrl;
      }
      return c.json({ posts });
    } catch (error) {
      return c.json({ message: "No images Found" });
    }
  })
  .post("/create-post/:id", zValidator("form", createPostSchema), async (c) => {
    try {
      const userId = parseInt(c.req.param("id"));
      if (isNaN(userId)) return c.json({ message: "Not a valid ID" }, 400);
      const postData = c.req.valid("form");
      let uniqueKey: string | null = null;
      if (postData.image)
        ({ uniqueKey } = await uploadImageToMinio(postData.image!));
      const newPost = await db
        .insert(postsTable)
        .values({
          title: postData.title,
          content: postData.content,
          userId,
          imageKey: uniqueKey,
        })
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
        .select()
        .from(postsTable)
        .where(and(eq(postsTable.id, postId), eq(postsTable.userId, userId)));
      let res: string | null = null;
      if (deletedPost[0].imageKey)
        res = await deleteImageFromMinio(deletedPost[0].imageKey);

      if (res) throw new Error("Couldn't delete an image");

      const deleteResult = await db
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
 * 1- Route to post, DONE
 * 2- Route to delete DONE
 * 3- Route to modify DONE
 * 4- Route to get a specifc post DONE
 * 5- Route to get all posts DONE
 */
