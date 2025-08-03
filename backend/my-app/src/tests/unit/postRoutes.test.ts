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

    it("should handle invalid user ID parameter", async () => {
      const res = await app.request("/api/posts/get-post/invalid/1");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid IDs");
    });

    it("should handle invalid post ID parameter", async () => {
      const res = await app.request("/api/posts/get-post/1/invalid");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid IDs");
    });

    it("should handle database error", async () => {
      (mockDb.where as any).mockRejectedValue(
        new Error("Database connection failed")
      );

      const res = await app.request("/api/posts/get-post/1/1");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong");
    });

    it("should get post with image key", async () => {
      const fakePost = {
        id: 1,
        title: "testPost",
        content: "testContent",
        imageKey: "images/test.jpg",
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

    it("should handle invalid user ID", async () => {
      const res = await app.request("/api/posts/get-posts/invalid");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid ID");
    });

    it("should handle database error", async () => {
      (mockDb.where as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/posts/get-posts/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("No images Found");
    });

    it("should get posts with mixed image keys", async () => {
      const fakePosts = [
        {
          id: 1,
          title: "testPost",
          content: "testContent",
          imageKey: "images/test1.jpg",
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

    it("shouldn't create post with image", async () => {
      const newPost = {
        id: 1,
        title: "New Post",
        content: "New Content",
        userId: 1,
        imageKey: "test-key",
      };
      (mockDb.returning as any).mockResolvedValue([newPost]);

      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "New Content");
      formData.append(
        "image",
        new File(["test"], "test.jpg", { type: "image/jpeg" })
      );

      const res = await app.request("/api/posts/create-post/1", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("should handle missing title", async () => {
      const formData = new FormData();
      formData.append("content", "New Content");

      const res = await app.request("/api/posts/create-post/1", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("should handle missing content", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");

      const res = await app.request("/api/posts/create-post/1", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("should handle database error during creation", async () => {
      (mockDb.returning as any).mockRejectedValue(new Error("Database error"));

      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "New Content");

      const res = await app.request("/api/posts/create-post/1", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong creating new post");
    });

    it("should handle zero user ID", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "New Content");

      const res = await app.request("/api/posts/create-post/0", {
        method: "POST",
        body: formData,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Post uploaded Successfully");
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

    it("should delete post without image", async () => {
      const mockPost = {
        id: 1,
        title: "Test Post",
        content: "Test Content",
        userId: 1,
        imageKey: null,
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

    it("should handle invalid user ID", async () => {
      const res = await app.request("/api/posts/delete-post/invalid/1", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid Credentials");
    });

    it("should handle invalid post ID", async () => {
      const res = await app.request("/api/posts/delete-post/1/invalid", {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid Credentials");
    });

    it("should handle database error during deletion", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/posts/delete-post/1/1", {
        method: "DELETE",
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong");
    });

    it("should handle deletion when post exists but delete fails", async () => {
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
      (mockDb.returning as any).mockResolvedValue([]);

      const res = await app.request("/api/posts/delete-post/1/1", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Post deleted successfully");
    });
  });

  describe("PATCH /api/posts/update-post/:userid/:postid", () => {
    it("should update a post successfully", async () => {
      const updatedPost = {
        id: 1,
        title: "Updated Post",
        content: "Updated Content",
        userId: 1,
        imageKey: null,
      };

      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([updatedPost]);

      const formData = new FormData();
      formData.append("title", "Updated Post");
      formData.append("content", "Updated Content");

      const res = await app.request("/api/posts/update-post/1/1", {
        method: "PATCH",
        body: formData,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Post updated Successfully ");
    });

    it("should handle invalid credentials for update", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Post");

      const res = await app.request("/api/posts/update-post/invalid/1", {
        method: "PATCH",
        body: formData,
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid credentials");
    });

    it("should handle no data provided for update", async () => {
      const formData = new FormData();

      const res = await app.request("/api/posts/update-post/1/1", {
        method: "PATCH",
        body: formData,
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong while updating the post");
    });

    it("should handle post not found for update", async () => {
      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([]);

      const formData = new FormData();
      formData.append("title", "Updated Post");

      const res = await app.request("/api/posts/update-post/1/999", {
        method: "PATCH",
        body: formData,
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("No post found to update");
    });

    it("should handle database error during update", async () => {
      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockRejectedValue(new Error("Database error"));

      const formData = new FormData();
      formData.append("title", "Updated Post");

      const res = await app.request("/api/posts/update-post/1/1", {
        method: "PATCH",
        body: formData,
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong while updating the post");
    });
  });
});
