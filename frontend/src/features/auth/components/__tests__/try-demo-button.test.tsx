import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@/tests/render";
import { TryDemoButton } from "../try-demo-button";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const startDemo = vi.fn();
vi.mock("../../services/auth-api", () => ({ startDemo: () => startDemo() }));

describe("TryDemoButton", () => {
  beforeEach(() => {
    push.mockReset();
    startDemo.mockReset();
    sessionStorage.clear();
  });

  it("signs the visitor in with the token it receives and opens the dashboard", async () => {
    startDemo.mockResolvedValue({ access_token: "demo-token", token_type: "bearer" });
    render(<TryDemoButton />);

    await userEvent.click(screen.getByRole("button", { name: /try the demo/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(sessionStorage.getItem("access_token")).toBe("demo-token");
    expect(sessionStorage.getItem("login_time")).not.toBeNull();
  });

  it("disables the button while the demo is being prepared, so it cannot be clicked twice", async () => {
    startDemo.mockReturnValue(new Promise(() => {}));
    render(<TryDemoButton />);

    await userEvent.click(screen.getByRole("button", { name: /try the demo/i }));

    const button = await screen.findByRole("button", { name: /preparing your demo/i });
    expect(button).toBeDisabled();
    expect(startDemo).toHaveBeenCalledTimes(1);
  });

  it("explains a rate limit in plain words, whatever shape the server's 429 body has, and signs nobody in", async () => {
    // The limiter answers {"error": "Rate limit exceeded: 30 per 1 hour"}: there is no "detail" to show.
    startDemo.mockRejectedValue({ response: { status: 429, data: { error: "Rate limit exceeded: 30 per 1 hour" } } });
    render(<TryDemoButton />);

    await userEvent.click(screen.getByRole("button", { name: /try the demo/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many demos were started from your network/i);
    expect(push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("access_token")).toBeNull();
  });

  it("falls back to a friendly message when the server does not answer", async () => {
    startDemo.mockRejectedValue(new Error("Network Error"));
    render(<TryDemoButton />);

    await userEvent.click(screen.getByRole("button", { name: /try the demo/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not start the demo/i);
  });

  it("explains what the demo is when asked to", () => {
    render(<TryDemoButton showHint />);

    expect(screen.getByText(/no sign-up needed/i)).toBeInTheDocument();
  });
});
