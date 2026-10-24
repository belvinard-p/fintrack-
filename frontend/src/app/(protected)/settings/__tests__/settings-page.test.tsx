import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@/tests/render";
import SettingsPage from "../page";

let currentUser: { data?: { is_demo: boolean } } = {};
vi.mock("@/features/auth", () => ({
  useCurrentUser: () => currentUser,
  ChangeEmailForm: () => <div>change email form</div>,
  ChangePasswordForm: () => <div>change password form</div>,
  DeleteAccountSection: () => <div>delete account section</div>,
}));
vi.mock("@/features/audit-logs", () => ({ AuditLogList: () => <div>activity list</div> }));

describe("SettingsPage", () => {
  it("offers email, password and account deletion on a real account", () => {
    currentUser = { data: { is_demo: false } };
    render(<SettingsPage />);

    expect(screen.getByText("change email form")).toBeInTheDocument();
    expect(screen.getByText("change password form")).toBeInTheDocument();
    expect(screen.getByText("delete account section")).toBeInTheDocument();
  });

  it("hides what a demo account cannot do, explains why, and keeps the activity list", () => {
    currentUser = { data: { is_demo: true } };
    render(<SettingsPage />);

    expect(screen.queryByText("change email form")).not.toBeInTheDocument();
    expect(screen.queryByText("change password form")).not.toBeInTheDocument();
    expect(screen.queryByText("delete account section")).not.toBeInTheDocument();
    expect(screen.getByText(/turned off in the demo account/i)).toBeInTheDocument();
    expect(screen.getByText("activity list")).toBeInTheDocument();
  });
});
