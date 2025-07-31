import { describe, expect, it, mock, beforeEach } from "bun:test";
import { Hono } from "hono";
import { userRoutes } from "../../routes/userRoutes";

type User = {
  id: number;
  email: string;
  username: string;
};

type MockDb = {
  select: () => MockDb;
  from: () => Promise<User[]>;
  insert: () => MockDb;
  update: () => MockDb;
  values: () => MockDb;
  set: () => MockDb;
  delete: () => MockDb;
  where: () => MockDb;
  returning: () => Promise<User[]>;
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
  let mockUser: any;

  beforeEach(() => {
    app = new Hono();
    app.route("/api/user", userRoutes);
    Object.values(mockDb).forEach((mockFn) => (mockFn as any).mockClear());
    minioDeleteMock.deleteImageFromMinio.mockClear();
  });
  describe("GET /api/user", () => {
    it("Should return all users", async () => {
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
  });
  describe("GET /api/user/", () => {
    it("Should return all posts from a single user", () => {});
  });
});
