import { describe, expect, it, mock, beforeEach, beforeAll } from "bun:test";
import { Hono } from "hono";

type Post = {
  id: number;
  title: string;
  content: string;
  imageKey?: string | null;
  userId: number;
};

type MockDb = {
  select: () => MockDb;
  from: () => MockDb;
  insert: () => MockDb;
  update: () => MockDb;
  values: () => MockDb;
  set: () => MockDb;
  delete: () => MockDb;
  where: () => Promise<any[]>;
  returning: () => Promise<any[]>;
};

const mockDb: MockDb = {
  select: mock(() => mockDb),
  from: mock(() => mockDb),
  insert: mock(() => mockDb),
  update: mock(() => mockDb),
  values: mock(() => mockDb),
  set: mock(() => mockDb),
  delete: mock(() => mockDb),
  where: mock(() => Promise.resolve([])),
  returning: mock(() => Promise.resolve([])),
};

mock.module("../../db", () => ({
  db: mockDb,
}));

mock.module("minio", () => ({
  Client: mock(() => ({})),
}));

mock.module("../../minio", () => ({
  initializeBucket: mock(() => Promise.resolve()),
  minioClient: {},
  BUCKET_NAME: "test-bucket",
}));

mock.module("../../minioHelpers", () => ({
  uploadImageToMinio: mock(() => Promise.resolve({ uniqueKey: "test-key" })),
  deleteImageFromMinio: mock(() => Promise.resolve(null)),
  getImageUrl: mock(() => Promise.resolve("http://test-url")),
}));

import { postsRoutes } from "../../routes/postsRoutes";

describe("Post Routes", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/api/posts", postsRoutes);
    Object.values(mockDb).forEach((mockFn) => (mockFn as any).mockClear());

    (mockDb.select as any).mockReturnValue(mockDb);
    (mockDb.from as any).mockReturnValue(mockDb);
    (mockDb.insert as any).mockReturnValue(mockDb);
    (mockDb.update as any).mockReturnValue(mockDb);
    (mockDb.values as any).mockReturnValue(mockDb);
    (mockDb.set as any).mockReturnValue(mockDb);
    (mockDb.delete as any).mockReturnValue(mockDb);
    (mockDb.where as any).mockResolvedValue([]);
    (mockDb.returning as any).mockResolvedValue([]);
  });

  describe("GET /api/posts", () => {
    it("should get all posts stored in db", async () => {
      const fakePosts = [
        { id: 1, title: "testPost", content: "testContent", imageKey: null },
        { id: 2, title: "test2Post", content: "testContent1", imageKey: null },
      ];

      (mockDb.from as any).mockResolvedValue(fakePosts);

      const res = await app.request("/api/posts");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.posts).toEqual(fakePosts);
    });

    it("should handle database error", async () => {
      (mockDb.from as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/posts");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Failed to fetch posts");
    });
  });

  describe("GET /api/posts/get-post/:userid/:postid", () => {
    it("should handle no post found", async () => {
      (mockDb.where as any).mockResolvedValue([]);

      const res = await app.request("/api/posts/get-post/999/1");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("No post found");
    });

    it("should get a specific post by a specific user", async () => {
      const fakePost = {
        id: 1,
        title: "testPost",
        content: "testContent",
        imageKey: null,
        userId: 1,
      };

      (mockDb.where as any).mockResolvedValue([fakePost]);

      const res = await app.request("/api/posts/get-post/1/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.post).toEqual([fakePost]);
    });
  });

  describe("GET /api/posts/get-posts/:userid", () => {
    it("should get all posts by a specific user", async () => {
      const fakePosts = [
        {
          id: 1,
          title: "testPost",
          content: "testContent",
          imageKey: null,
          userId: 1,
        },
        {
          id: 2,
          title: "testPost2",
          content: "testContent2",
          imageKey: null,
          userId: 1,
        },
      ];

      (mockDb.where as any).mockResolvedValue(fakePosts);

      const res = await app.request("/api/posts/get-posts/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.posts).toEqual(fakePosts);
    });

    it("should handle no posts found", async () => {
      (mockDb.where as any).mockResolvedValue([]);

      const res = await app.request("/api/posts/get-posts/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("No posts found for this user");
    });
  });

  describe("POST /api/posts/create-post/:id", () => {
    it("should create a new post", async () => {
      const newPost = {
        id: 1,
        title: "New Post",
        content: "New Content",
        userId: 1,
        imageKey: null,
      };
      (mockDb.returning as any).mockResolvedValue([newPost]);

      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "New Content");

      const res = await app.request("/api/posts/create-post/1", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Post uploaded Successfully");
    });

    it("should handle invalid user ID", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "New Content");

      const res = await app.request("/api/posts/create-post/invalid", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Not a valid ID");
    });
  });

  describe("DELETE /api/posts/delete-post/:userid/:postid", () => {
    it("should delete a post successfully", async () => {
      const mockPost = {
        id: 1,
        title: "Test Post",
        content: "Test Content",
        userId: 1,
        imageKey: "test-image.jpg",
      };

      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValueOnce([mockPost]);

      (mockDb.delete as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([mockPost]);

      const res = await app.request("/api/posts/delete-post/1/1", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Post deleted successfully");
    });

    it("should handle post not found", async () => {
      (mockDb.select as any).mockReturnValueOnce(mockDb);
      (mockDb.from as any).mockReturnValueOnce(mockDb);
      (mockDb.where as any).mockResolvedValueOnce([]);

      const res = await app.request("/api/posts/delete-post/999/999", {
        method: "DELETE",
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong");
    });
  });
});
