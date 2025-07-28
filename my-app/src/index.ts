import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { postsRoutes } from "./routes/postsRoutes";
import { userRoutes } from "./routes/userRoutes";
import { drizzle } from "drizzle-orm/singlestore/driver";
import { configDotenv } from "dotenv";

const db = drizzle(process.env.POSTGRESS_CONNECTION as string);
const app = new Hono();

const result = await db.execute("select 1");
app.use("*", logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/api/posts", postsRoutes);
app.route("/api/user", userRoutes);

export default app;
