import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import CreateUser from "../pages/CreateUser";

const mockFetch = vi.fn();
global.fetch = mockFetch;
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

describe("Create User Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 1,
          username: "testuser",
          email: "test@example.com",
        }),
    });
  });

  it("renders the create user form", () => {
    render(
      <TestWrapper>
        <CreateUser />
      </TestWrapper>
    );

    expect(screen.getByText("Create User")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("submits the form and redirects on success", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <CreateUser />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText("Username");
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: "Register" });

    await user.type(usernameInput, "new_user");
    await user.type(emailInput, "new_user@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/user/create-user",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            username: "new_user",
            email: "new_user@example.com",
          }),
        })
      );
    });
  });
  it("shows error message on submission failure", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    render(
      <TestWrapper>
        <CreateUser />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText("Username");
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: "Register" });

    await user.type(usernameInput, "error_user");
    await user.type(emailInput, "error_user@example.com");
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  it("calls onUserCreated callback on successful user creation", async () => {
    const user = userEvent.setup();
    const onUserCreated = vi.fn();

    render(
      <TestWrapper>
        <CreateUser onUserCreated={onUserCreated} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText("Username");
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: "Register" });

    await user.type(usernameInput, "callback_user");
    await user.type(emailInput, "callback_user@example.com");
    await user.click(submitButton);
    await waitFor(() => {
      expect(
        screen.getByText(/User created successfully/i)
      ).toBeInTheDocument();
      expect(onUserCreated).toHaveBeenCalled();
    });
  });
});
