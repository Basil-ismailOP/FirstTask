import { describe, expect, it, mock, beforeEach } from "bun:test";
import { Hono } from "hono";
import { userRoutes } from "../../routes/userRoutes";

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

mock.module("../../db", () => ({ db: mockDb }));
mock.module("../../minioHelpers.ts", () => minioDeleteMock);

describe("User Routes", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/api/user", userRoutes);
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
  describe("GET /api/user", () => {
    it("/  Should return all users", async () => {
      const mockUsers = [
        { id: 1, email: "test@test.com", username: "testuser" },
        { id: 2, email: "test2@test.com", username: "testuser2" },
      ];
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockResolvedValue(mockUsers);
      const res = await app.request("/api/user");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toEqual(mockUsers);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.from).toHaveBeenCalledTimes(1);
    });
    it("/get-users/posts/:id Should return all user's posts", async () => {
      const mockPosts = [
        {
          id: 1,
          title: "testPost",
          content: "testing",
          imageKey: "images/dummy.png",
          userId: 1,
        },
      ];
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValue(mockPosts);

      const res = await app.request("/api/user/get-users-posts/1");
      const body = await res.json();
      expect(body.posts).toEqual(mockPosts);
    });
  });

  describe("POST /api/user", () => {
    it("/create-user Should create user", async () => {
      const dummyNewUser = {
        username: "Ahmed",
        email: "email@nice.com",
      };
      const res = await app.request("/api/user/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummyNewUser),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("User Created Successfully");
    });
    it("/create-user Should fail with invalid eamil", async () => {
      const invalidUser = {
        username: "Ahmed ",
        email: "not a valid emaiil",
      };
      const res = await app.request("/api/user/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUser),
      });
      expect(res.status).toBe(400);
    });
    it("/create-user Should handle DB error", async () => {
      const dummyNewUser = {
        username: "AHmed",
        email: "email@nice.com",
      };
      (mockDb.insert as any).mockReturnValue(mockDb);
      (mockDb.values as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockRejectedValue(new Error("DB error"));

      const res = await app.request("/api/user/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummyNewUser),
      });
      expect(res.status).toBe(500);
    });
  });
  describe("PATCH /api/user", () => {
    it("/update-user Should handle updating user's info", async () => {
      const updatedUser = {
        username: "Basil",
      };
      const oldDataUser = {
        id: 1,
        username: "Ahmed",
        email: "test@test.com",
      };
      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([
        {
          ...oldDataUser,
          username: updatedUser.username,
        },
      ]);
      const res = await app.request("/api/user/update-user/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      const body = await res.json();
      expect(body.message).toBe("Updated user Successfuly");
      expect(res.status).toBe(200);
    });
  });
  describe("DELETE /api/user", () => {
    it("/delete-user/:id Should delete the user", async () => {
      const mockUsers = [
        {
          id: 1,
          username: "Ahmed",
          email: "test@test.com",
        },
      ];

      const mockUsersPost = [
        {
          id: 1,
          title: "testPost",
          content: "testing",
          imageKey: "images/dummy.png",
          userId: 1,
        },
      ];
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValueOnce(mockUsersPost);

      (mockDb.delete as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue(mockUsers);
      const res = await app.request("/api/user/delete-user/1", {
        method: "DELETE",
      });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.message).toBe("User deleted Successfully ");
    });
  });
});
