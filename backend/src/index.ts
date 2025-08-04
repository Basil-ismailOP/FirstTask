import { Hono } from "hono";
import { logger } from "hono/logger";
import { postsRoutes } from "./routes/postsRoutes";
import { userRoutes } from "./routes/userRoutes";
import "dotenv/config";

import { cors } from "hono/cors";

import { Kafka, CompressionTypes, CompressionCodecs } from "kafkajs";
import SnappyCodec from "kafkajs-snappy";
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const kafka = new Kafka({
  brokers: ["localhost:9092"],
  connectionTimeout: 3000,
  requestTimeout: 2500,
  retry: {
    initialRetryTime: 100,
    retries: 10,
  },
  clientId: "producer",
});

export const producer = kafka.producer();
producer.connect().catch((err) => {
  console.error("Failed to connect producer:", err);
});

producer.on("producer.connect", () => {
  console.log("Producer connected successfully");
});
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
