import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema, updateUserSchema } from "../model/userScehams";
import { db } from "../db";
import { postsTable, usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { deleteImageFromMinio } from "../minioHelpers";

export const userRoutes = new Hono()
  .get("/", async (c) => {
    try {
      const users = await db.select().from(usersTable);
      return c.json({ users });
    } catch (error) {
      return c.json({ message: "Failed to load users", error }, 500);
    }
  })
  .get("/get-users-posts/:id", async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const posts = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.userId, id));

      if (!posts.length)
        return c.json({ message: "No posts found for this user" }, 404);
      return c.json({ message: "Found  all posts successfully ", posts });
    } catch (error) {
      return c.json({ message: "Something went wrong fetching posts" }, 500);
    }
  })
  .post("/create-user", zValidator("json", createUserSchema), async (c) => {
    try {
      const userData = c.req.valid("json");
      const newUser = await db
        .insert(usersTable)
        .values({
          email: userData.email,
          username: userData.username,
        })
        .returning();
      return c.json({ message: "User Created Successfully" });
    } catch (error) {
      return c.json({ message: "Error while inserting new user", error }, 500);
    }
  })
  .patch(
    "/update-user/:id",
    zValidator("json", updateUserSchema),
    async (c) => {
      try {
        const id = parseInt(c.req.param("id"));
        if (isNaN(id)) return c.json({ message: "Invalid User Id" }, 400);

        const updateData = c.req.valid("json");
        if (!Object.keys(updateData).length)
          return c.json({ message: "No data provided" }, 400);

        const updatedUser = await db
          .update(usersTable)
          .set(updateData)
          .where(eq(usersTable.id, id))
          .returning();
        if (!updatedUser.length)
          return c.json({ message: "User not found " }, 404);
        return c.json({ message: "Updated user Successfuly" }, 200);
      } catch (error) {
        return c.json({ message: "Couldn't update the user" }, 500);
      }
    }
  )
  .delete("/delete-user/:id", async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) return c.json({ message: "id is invalid" }, 400);

      const deleteUserPosts = await db
        .select({ imageKey: postsTable.imageKey })
        .from(postsTable)
        .where(eq(postsTable.userId, id));

      for (let image of deleteUserPosts) {
        if (image.imageKey) await deleteImageFromMinio(image.imageKey);
      }
      const deleteUser = await db
        .delete(usersTable)
        .where(eq(usersTable.id, id))
        .returning();

      if (!deleteUser.length)
        return c.json({ message: "User not found " }, 404);
      return c.json({
        message: "User deleted Successfully ",
        deleteUser: deleteUser[0],
      });
    } catch (error) {
      return c.json(
        { message: "Something went wrong", error, status: 200 },
        500
      );
    }
  });

/**
 * Todo:
 * 1- Route to Create a user DONE
 * 2- Route to modify user's info DONE
 * 3- Route to get user's Posts DONE
 * 4- Rotue to Delete user DONE
 *
 */
