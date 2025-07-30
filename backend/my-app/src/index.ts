import { Hono } from "hono";
import { logger } from "hono/logger";
import { postsRoutes } from "./routes/postsRoutes";
import { userRoutes } from "./routes/userRoutes";
import "dotenv/config";

import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/api/posts", postsRoutes);
app.route("/api/user", userRoutes);

export default app;
