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

    it("should handle database error when getting all users", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/user");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Failed to load users");
    });

    it("should return empty array when no users exist", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockResolvedValue([]);

      const res = await app.request("/api/user");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toEqual([]);
    });
  });

  describe("GET /api/user/get-users-posts/:id", () => {
    it("Should return all user's posts", async () => {
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

    it("should handle no posts found for user", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValue([]);

      const res = await app.request("/api/user/get-users-posts/1");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("No posts found for this user");
    });

    it("should handle invalid user ID parameter", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValue([]);

      const res = await app.request("/api/user/get-users-posts/abc");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("No posts found for this user");
    });

    it("should handle database error when getting user posts", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/user/get-users-posts/1");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong fetching posts");
    });

    it("should handle zero user ID", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValue([]);

      const res = await app.request("/api/user/get-users-posts/0");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("No posts found for this user");
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

    it("/create-user Should fail with invalid email", async () => {
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

    it("/create-user Should fail with missing username", async () => {
      const invalidUser = {
        email: "valid@email.com",
      };
      const res = await app.request("/api/user/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUser),
      });
      expect(res.status).toBe(400);
    });

    it("/create-user Should fail with empty username", async () => {
      const invalidUser = {
        username: "",
        email: "valid@email.com",
      };
      const res = await app.request("/api/user/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUser),
      });
      expect(res.status).toBe(400);
    });

    it("/create-user Should fail with missing email", async () => {
      const invalidUser = {
        username: "ValidUsername",
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

    it("/create-user Should handle malformed JSON", async () => {
      const res = await app.request("/api/user/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });
      expect(res.status).toBe(400);
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

    it("/update-user Should handle updating user's email", async () => {
      const updatedUser = {
        email: "newemail@test.com",
      };
      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([
        {
          id: 1,
          username: "Ahmed",
          email: updatedUser.email,
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

    it("/update-user Should handle updating both username and email", async () => {
      const updatedUser = {
        username: "NewUsername",
        email: "newemail@test.com",
      };
      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([
        {
          id: 1,
          username: updatedUser.username,
          email: updatedUser.email,
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

    it("/update-user Should handle invalid user ID", async () => {
      const updatedUser = {
        username: "Basil",
      };
      const res = await app.request("/api/user/update-user/abc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid User Id");
    });

    it("/update-user Should handle no data provided", async () => {
      const res = await app.request("/api/user/update-user/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("No data provided");
    });

    it("/update-user Should handle user not found", async () => {
      const updatedUser = {
        username: "Basil",
      };
      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([]);

      const res = await app.request("/api/user/update-user/999", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("User not found ");
    });

    it("/update-user Should handle database error", async () => {
      const updatedUser = {
        username: "Basil",
      };
      (mockDb.update as any).mockReturnValue(mockDb);
      (mockDb.set as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/user/update-user/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Couldn't update the user");
    });

    it("/update-user Should handle invalid email in update", async () => {
      const updatedUser = {
        email: "invalid-email",
      };
      const res = await app.request("/api/user/update-user/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      expect(res.status).toBe(400);
    });

    it("/update-user Should handle empty username in update", async () => {
      const updatedUser = {
        username: "",
      };
      const res = await app.request("/api/user/update-user/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      expect(res.status).toBe(400);
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

    it("/delete-user/:id Should delete user without posts", async () => {
      const mockUsers = [
        {
          id: 1,
          username: "Ahmed",
          email: "test@test.com",
        },
      ];

      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValueOnce([]); // No posts

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

    it("/delete-user/:id Should delete user with posts without images", async () => {
      const mockUsers = [
        {
          id: 1,
          username: "Ahmed",
          email: "test@test.com",
        },
      ];

      const mockUsersPost = [
        {
          imageKey: null,
        },
        {
          imageKey: null,
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
      expect(minioDeleteMock.deleteImageFromMinio).not.toHaveBeenCalled();
    });

    it("/delete-user/:id Should handle invalid user ID", async () => {
      const res = await app.request("/api/user/delete-user/abc", {
        method: "DELETE",
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("id is invalid");
    });

    it("/delete-user/:id Should handle user not found", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValueOnce([]); // No posts

      (mockDb.delete as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([]); // User not found

      const res = await app.request("/api/user/delete-user/999", {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("User not found ");
    });

    it("/delete-user/:id Should handle database error during post lookup", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/user/delete-user/1", {
        method: "DELETE",
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong");
    });

    it("/delete-user/:id Should handle database error during user deletion", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValueOnce([]); // No posts

      (mockDb.delete as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockRejectedValue(new Error("Database error"));

      const res = await app.request("/api/user/delete-user/1", {
        method: "DELETE",
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong");
    });

    it("/delete-user/:id Should handle MinIO deletion error", async () => {
      const mockUsers = [
        {
          id: 1,
          username: "Ahmed",
          email: "test@test.com",
        },
      ];

      const mockUsersPost = [
        {
          imageKey: "images/dummy.png",
        },
      ];

      minioDeleteMock.deleteImageFromMinio.mockRejectedValue(
        new Error("MinIO error")
      );

      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValueOnce(mockUsersPost);

      const res = await app.request("/api/user/delete-user/1", {
        method: "DELETE",
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toBe("Something went wrong");
    });

    it("/delete-user/:id Should handle zero user ID", async () => {
      (mockDb.select as any).mockReturnValue(mockDb);
      (mockDb.from as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockResolvedValueOnce([]); // No posts

      (mockDb.delete as any).mockReturnValue(mockDb);
      (mockDb.where as any).mockReturnValue(mockDb);
      (mockDb.returning as any).mockResolvedValue([]); // User not found

      const res = await app.request("/api/user/delete-user/0", {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe("User not found ");
    });
  });
});
