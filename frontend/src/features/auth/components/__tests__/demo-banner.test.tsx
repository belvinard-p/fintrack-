import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@/tests/render";
import { DemoBanner } from "../demo-banner";

let currentUser: { data?: { is_demo: boolean } } = {};
vi.mock("../../hooks/use-current-user", () => ({ useCurrentUser: () => currentUser }));

describe("DemoBanner", () => {
  it("tells a demo visitor it is a throwaway account and offers to create a real one", () => {
    currentUser = { data: { is_demo: true } };
    render(<DemoBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(/demo account/i);
    expect(screen.getByRole("link", { name: /create your own free account/i })).toHaveAttribute("href", "/register");
  });

  it("is never shown on a real account", () => {
    currentUser = { data: { is_demo: false } };
    render(<DemoBanner />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows nothing while the user is still loading", () => {
    currentUser = {};
    render(<DemoBanner />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
