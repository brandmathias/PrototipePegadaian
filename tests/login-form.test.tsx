import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/login",
  push: vi.fn(),
  refresh: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => navigationMocks,
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: authMocks.signInEmail
    },
    signUp: {
      email: authMocks.signUpEmail
    }
  }
}));

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { ToastProvider } from "@/components/ui/toast";

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("LoginForm", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/login";
    navigationMocks.push.mockClear();
    navigationMocks.refresh.mockClear();
    authMocks.signInEmail.mockReset();
    authMocks.signUpEmail.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            role: "buyer"
          }
        })
      })
    );
  });

  it("uses the dedicated fullscreen login shell without the old auth navigation", () => {
    render(
      <AuthShell>
        <div>Login canvas</div>
      </AuthShell>
    );

    expect(screen.getByText("Login canvas")).toBeInTheDocument();
    expect(screen.queryByText("Kembali ke beranda")).not.toBeInTheDocument();
    expect(screen.queryByText("Akses aman untuk pembeli")).not.toBeInTheDocument();
  });

  it("uses the dedicated fullscreen register shell without the old auth navigation", () => {
    navigationMocks.pathname = "/register";

    render(
      <AuthShell>
        <div>Register canvas</div>
      </AuthShell>
    );

    expect(screen.getByText("Register canvas")).toBeInTheDocument();
    expect(screen.queryByText("Kembali ke beranda")).not.toBeInTheDocument();
    expect(screen.queryByText("Akses aman untuk pembeli")).not.toBeInTheDocument();
  });

  it("shows a smooth verification state while sign in is pending", async () => {
    let resolveSignIn: (value: { error: null }) => void = () => {};
    authMocks.signInEmail.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      })
    );

    renderWithToast(<LoginForm />);

    expect(screen.queryByText("Google")).not.toBeInTheDocument();
    expect(screen.queryByText("Apple ID")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email akun/i), {
      target: {
        value: "Buyer.Demo@example.com"
      }
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i, { selector: "input" }), {
      target: {
        value: "password-rahasia"
      }
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /masuk/i })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    expect(authMocks.signInEmail).toHaveBeenCalledWith({
      email: "buyer.demo@example.com",
      password: "password-rahasia"
    });
    expect(screen.getByRole("button", { name: /memverifikasi akun/i })).toBeDisabled();

    resolveSignIn({ error: null });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Login berhasil");
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /login berhasil/i })).toBeDisabled();
    });
    await waitFor(() => {
      expect(navigationMocks.push).toHaveBeenCalledWith("/dashboard");
    }, { timeout: 2200 });
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });

  it("lets the buyer reveal the password and shows failed login feedback", async () => {
    authMocks.signInEmail.mockResolvedValue({
      error: {
        message: "Email atau kata sandi tidak cocok."
      }
    });

    renderWithToast(<LoginForm />);

    const passwordInput = screen.getByLabelText(/kata sandi/i, { selector: "input" }) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: /tampilkan kata sandi/i }));
    expect(passwordInput.type).toBe("text");

    fireEvent.change(screen.getByLabelText(/email akun/i), {
      target: {
        value: "buyer.demo@example.com"
      }
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password-rahasia"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /^masuk$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Masuk belum berhasil");
    expect(screen.getByRole("alert")).toHaveTextContent("Email atau kata sandi tidak cocok.");
  });

  it("uses the register visual feedback and password reveal interaction", async () => {
    authMocks.signUpEmail.mockResolvedValue({
      error: {
        message: "Email sudah terdaftar"
      }
    });

    renderWithToast(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/kata sandi/i, { selector: "input" }) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: /tampilkan kata sandi/i }));
    expect(passwordInput.type).toBe("text");

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: {
        value: "Raras Maheswari Demo"
      }
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: {
        value: "raras.new@example.com"
      }
    });
    fireEvent.change(screen.getByLabelText(/nomor telepon/i), {
      target: {
        value: "081200009999"
      }
    });
    fireEvent.change(screen.getByLabelText(/nomor ktp/i), {
      target: {
        value: "7371121305260003"
      }
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password-rahasia"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /daftar sekarang/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Registrasi belum berhasil");
    expect(authMocks.signUpEmail).toHaveBeenCalledWith({
      email: "raras.new@example.com",
      name: "Raras Maheswari Demo",
      nationalId: "7371121305260003",
      password: "password-rahasia",
      phoneNumber: "6281200009999"
    });
  });
});
