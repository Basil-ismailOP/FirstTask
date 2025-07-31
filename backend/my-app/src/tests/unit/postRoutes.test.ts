import { describe, expect, it, mock, beforeEach } from "bun:test";
import { Hono } from "hono";
import { userRoutes } from "../../routes/userRoutes";
import { request } from "http";

type User = {
  id: number;
  email: string;
  username: string;
};

type Post = {
  id: number;
  title: string;
  content: string;
  imageKey?: string | null;
  userId: number;
};

type MockDb = {
  select: () => MockDb;
  from: () => Promise<any[]>;
  insert: () => MockDb;
  update: () => MockDb;
  values: () => MockDb;
  set: () => MockDb;
  delete: () => MockDb;
  where: () => MockDb;
  returning: () => Promise<any[]>;
};

const mockDb: MockDb = {
  select: mock(() => mockDb),
  from: mock(() => Promise.resolve([])),
  insert: mock(() => mockDb),
  values: mock(() => mockDb),
  update: mock(() => mockDb),
  set: mock(() => mockDb),
  delete: mock(() => mockDb),
  where: mock(() => mockDb),
  returning: mock(() => Promise.resolve([])),
};

const minioDeleteMock = {
  deleteImageFromMinio: mock(() => Promise.resolve(null)),
};

describe("Post Routes", () => {
  let app: Hono;
  beforeEach(() => {
    app = new Hono();
    app.route("/api/posts", userRoutes);
    (mockDb.select as any).mockReturnValue(mockDb);
    (mockDb.insert as any).mockReturnValue(mockDb);
    (mockDb.update as any).mockReturnValue(mockDb);
    (mockDb.values as any).mockReturnValue(mockDb);
    (mockDb.set as any).mockReturnValue(mockDb);
    (mockDb.delete as any).mockReturnValue(mockDb);
    (mockDb.where as any).mockReturnValue(mockDb);
    (mockDb.from as any).mockResolvedValue([]);
    (mockDb.returning as any).mockResolvedValue([]);
    Object.values(mockDb).forEach((mockFn) => (mockFn as any).mockClear());
    minioDeleteMock.deleteImageFromMinio.mockClear();
  });
  describe("GET /api/posts", () => {
    it("/ Should get all posts stored in db", async () => {
      const fakePosts = [
        {
          id: 1,
          title: "testPost",
          content: "testContent",
          imageKey: null,
        },
        {
          id: 2,
          title: "test2Post",
          content: "testContent1",
          imageKey: null,
        },
        {
          id: 3,
          title: "testPost3",
          content: "testContent3",
          imageKey: null,
        },
      ];
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockResolvedValue(fakePosts);
      const res = await app.request("/api/posts");

      expect(res.status).toBe(200);
      const body = await res.json();
    });

    it("/ Should handle DB dropdown ", async () => {});
    it("/get-post/:userid/:postid Should handle No user found", async () => {});
    it("/get-post/:userid/:postid Should handle missing post", async () => {});
    it("/get-post/:userid/:postid Should get a specific post by a specific user", async () => {});
    it("/get-posts/:userid should get all posts by a specific user ", async () => {});
    it("/get-posts/:userid should handle no posts found", async () => {});
  });
  //   describe("POST /api/posts", () => {
  //     it("newTest", async () => {
  //       const res = await app.request("/api/posts");
  //     });
  //   });
  describe("DELETE /api/posts", () => {});
});
