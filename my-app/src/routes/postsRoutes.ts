import { Hono } from "hono";
import { z } from "zod";

export type Posts = {
  id: number;
  content: string;
  title: string;
};

export const dummyPosts: Posts[] = [
  { id: 1, content: "This is wonderful!", title: "Wonderland" },
];

const createPostSchema = z.object({
  title: z.string(),
  amount: z.number(),
});

export const postsRoutes = new Hono()
  .get("/", (c) => {
    return c.json({ posts: [] });
  })
  .post("/", async (c) => {
    try {
      const data = await c.req.json();
      const post = createPostSchema.parse(data);
      console.log(post);
      return c.json(post);
    } catch (e) {
      return c.json({ message: "Invalid Data" }, 500);
    }
  });
