import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Home, { type User } from "../pages/Home";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUsers: User[] = [
  { id: 1, username: "john_doe", email: "john@example.com" },
  { id: 2, username: "jane_smith", email: "jane@example.com" },
  { id: 3, username: "bob_wilson", email: "bob@example.com" },
];

const mockPosts = [
  {
    id: 1,
    title: "First Post",
    content: "This is the first post content",
    imageKey: "https://example.com/image1.jpg",
  },
  {
    id: 2,
    title: "Second Post",
    content: "This is the second post content",
    imageKey: null,
  },
];

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
}

describe("Home Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/posts/get-posts/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ posts: mockPosts }),
        } as Response);
      }

      if (url.includes("/api/posts/create-post/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 3,
              title: "New Post",
              content: "New content",
            }),
        } as Response);
      }

      if (url.includes("/api/posts/delete-post/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }

      return Promise.reject(new Error("Unknown URL"));
    });
  });

  describe("Rendering", () => {
    it("renders the users table with correct headers", () => {
      render(
        <TestWrapper>
          <Home users={mockUsers} />
        </TestWrapper>
      );

      expect(screen.getByText("Users and their posts")).toBeInTheDocument();
      expect(screen.getByText("name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("View Posts")).toBeInTheDocument();
    });

    it("renders all users in the table", () => {
      render(
        <TestWrapper>
          <Home users={mockUsers} />
        </TestWrapper>
      );

      expect(screen.getByText("john_doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("jane_smith")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(screen.getByText("bob_wilson")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });

    it("renders delete buttons for each user", () => {
      render(
        <TestWrapper>
          <Home users={mockUsers} />
        </TestWrapper>
      );

      const deleteButtons = screen.getAllByText("X");
      expect(deleteButtons).toHaveLength(3);

      const deleteLinks = screen.getAllByRole("link");
      expect(deleteLinks[0]).toHaveAttribute("href", "/delete-user/1");
      expect(deleteLinks[1]).toHaveAttribute("href", "/delete-user/2");
      expect(deleteLinks[2]).toHaveAttribute("href", "/delete-user/3");
    });

    it("renders add post buttons for each user", () => {
      render(
        <TestWrapper>
          <Home users={mockUsers} />
        </TestWrapper>
      );

      const addPostButtons = screen.getAllByText("+");
      expect(addPostButtons).toHaveLength(3);
    });

    it("handles empty users array gracefully", () => {
      render(
        <TestWrapper>
          <Home users={[]} />
        </TestWrapper>
      );

      expect(screen.getByText("Users and their posts")).toBeInTheDocument();
      expect(screen.queryByText("john_doe")).not.toBeInTheDocument();
    });
  });

  describe("Posts Loading", () => {
    it("shows loading state while fetching posts", async () => {
      render(
        <TestWrapper>
          <Home users={mockUsers} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByText("Loading posts...")).toHaveLength(3);
      });
    });

    it("shows View Posts button after posts are loaded", async () => {
      render(
        <TestWrapper>
          <Home users={mockUsers} />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewPostsButtons = screen.getAllByText("View Posts");
        expect(viewPostsButtons).toHaveLength(4);
      });
    });

    it("handles posts loading error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("API Error"));

      render(
        <TestWrapper>
          <Home users={[mockUsers[0]]} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Error loading posts")).toBeInTheDocument();
      });
    });
  });

  describe("Add Post Dialog", () => {
    it("opens add post dialog when + button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Home users={[mockUsers[0]]} />
        </TestWrapper>
      );

      const addButton = screen.getAllByText("+")[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("New Post")).toBeInTheDocument();
        expect(screen.getByText("Fill in infos")).toBeInTheDocument();
      });
    });

    it("creates a new post successfully", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Home users={[mockUsers[0]]} />
        </TestWrapper>
      );

      const addButton = screen.getAllByText("+")[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("New Post")).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText("Title"), "Test Post");
      await user.type(screen.getByPlaceholderText("content"), "Test content");

      await user.click(screen.getByText("Upload"));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "http://localhost:3000/api/posts/create-post/1",
          expect.objectContaining({
            method: "POST",
            body: expect.any(FormData),
          })
        );
      });
    });

    it("requires title and content fields", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Home users={[mockUsers[0]]} />
        </TestWrapper>
      );

      const addButton = screen.getAllByText("+")[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("New Post")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Upload"));

      expect(screen.getByPlaceholderText("Title")).toBeInvalid();
      expect(screen.getByPlaceholderText("content")).toBeInvalid();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(
        <TestWrapper>
          <Home users={mockUsers} />
        </TestWrapper>
      );

      expect(screen.getByText("Users and their posts")).toBeInTheDocument();
    });

    it("has proper form labels", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Home users={[mockUsers[0]]} />
        </TestWrapper>
      );

      const addButton = screen.getAllByText("+")[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Title")).toBeInTheDocument();
        expect(screen.getByLabelText("Content")).toBeInTheDocument();
        expect(screen.getByLabelText("Picture")).toBeInTheDocument();
      });
    });
  });
});
