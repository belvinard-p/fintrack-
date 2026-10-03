import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@/tests/render";
import { ChangePasswordForm } from "../change-password-form";

// Mock the mutation hook — we control what mutateAsync does per test
const mockMutateAsync = vi.fn();
vi.mock("@/features/auth/hooks/use-change-password", () => ({
  useChangePassword: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
  });

  it("renders both password fields and the submit button", () => {
    render(<ChangePasswordForm />);

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("calls mutateAsync with the entered values on submit", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/current password/i), "oldpass123");
    await user.type(screen.getByLabelText(/new password/i), "newpass456");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        current_password: "oldpass123",
        new_password: "newpass456",
      })
    );
  });

  it("shows a success message and clears fields after successful submit", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/current password/i), "oldpass123");
    await user.type(screen.getByLabelText(/new password/i), "newpass456");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(screen.getByText(/password updated/i)).toBeInTheDocument()
    );

    expect(screen.getByLabelText<HTMLInputElement>(/current password/i).value).toBe("");
    expect(screen.getByLabelText<HTMLInputElement>(/new password/i).value).toBe("");
  });

  it("shows an error message when the mutation fails", async () => {
    mockMutateAsync.mockRejectedValue({
      response: { data: { detail: "Wrong password" } },
    });
    const user = userEvent.setup();

    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/current password/i), "wrongpass");
    await user.type(screen.getByLabelText(/new password/i), "newpass456");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/wrong password/i)).toBeInTheDocument();
  });
});
