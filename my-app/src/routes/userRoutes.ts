import { Hono } from "hono";
import { Posts } from "./postsRoutes";
import { dummyData, dummyPosts } from "../data";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema, updateUserSchema } from "../model/userScehams";
import { db } from "../db";
import { usersTable } from "../db/schema";

export type User = {
  email: string;
  username: string;
  posts: Posts[];
};

export const userRoutes = new Hono()
  .get("/", async (c) => {
    try {
      const users = await db.select().from(usersTable);
      return c.json({ users });
    } catch (error) {
      return c.json({ message: "Failed to load users", error }, 500);
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
    "/update-user/:username",
    zValidator("json", updateUserSchema),
    (c) => {
      const username = c.req.param("username");
      const data = c.req.valid("json");

      const user = dummyData.find((user) => {
        user.username == username;
      });

      if (!user) return c.json({ message: "No user with such name" }, 404);

      if ("email" in data) user.email = (data.email as string) ?? user.email;

      if ("username" in data)
        user.username = (data.username as string) ?? user.username;

      return c.json({ message: "Updated successfully", user });
    }
  )
  .delete("/delete-user/:username", (c) => {
    const username = c.req.param("username");
    const index = dummyData.findIndex((user) => {
      user.username == username;
    });
    if (!index) return c.json({ message: "No user found to delete" }, 404);
    dummyData.splice(index, 1);

    return c.json({ message: "Deleted Successfully " }, 200);
  });

/**
 * Todo:
 * 1- Route to Create a user
 * 2- Route to modify user's info
 * 3- Route to get user's Posts
 * 4- Rotue to Delete user
 *
 */
