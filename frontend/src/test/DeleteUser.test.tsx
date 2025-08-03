import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DeleteUser from "../pages/DeleteUser";
import type { User } from "../pages/Home";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to render component with router and query client
function renderWithRouter(
  ui: React.ReactNode,
  { path = "/delete-user/:userId", entry = "/delete-user/1" } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DeleteUser Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it("renders 'no user found' when list is empty", () => {
    renderWithRouter(<DeleteUser users={[]} onUserDelete={vi.fn()} />);
    expect(screen.getByText(/no user found/i)).toBeInTheDocument();
  });

  it("renders confirmation and user info when user exists", () => {
    const users: User[] = [
      { id: 1, username: "john", email: "john@example.com" },
    ];
    renderWithRouter(<DeleteUser users={users} onUserDelete={vi.fn()} />);
    expect(
      screen.getByText(/you are about to delete user john/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/are you sure\?/i)).toBeInTheDocument();
    expect(screen.getByText(/user:john/i)).toBeInTheDocument();
    expect(screen.getByText(/email:john@example.com/i)).toBeInTheDocument();
  });

  it("deletes user successfully when Yes is clicked", async () => {
    const users: User[] = [
      { id: 1, username: "john", email: "john@example.com" },
    ];
    const onUserDelete = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<DeleteUser users={users} onUserDelete={onUserDelete} />);
    await user.click(screen.getByRole("button", { name: /yes/i }));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/user/delete-user/1",
        expect.objectContaining({ method: "DELETE" })
      );
      expect(onUserDelete).toHaveBeenCalled();
      expect(
        screen.getByText(/user deleted successfully/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error message on deletion failure", async () => {
    const users: User[] = [
      { id: 1, username: "john", email: "john@example.com" },
    ];
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    renderWithRouter(<DeleteUser users={users} onUserDelete={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /yes/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it("remains on confirmation when Go back is clicked", async () => {
    const users: User[] = [
      { id: 1, username: "john", email: "john@example.com" },
    ];
    const user = userEvent.setup();
    renderWithRouter(<DeleteUser users={users} onUserDelete={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /go back/i }));
    expect(screen.getByText(/are you sure\?/i)).toBeInTheDocument();
  });
});
