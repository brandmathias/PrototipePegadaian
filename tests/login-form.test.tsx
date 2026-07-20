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
import { LogoutButton } from "@/components/auth/logout-button";
import { RegisterForm } from "@/components/auth/register-form";
import { ToastProvider } from "@/components/ui/toast";
import AuthLayout from "@/app/(auth)/layout";

const BUYER_VIEWER_CACHE_KEY = "pegadaian:buyer-nav-viewer:v1";

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
    window.sessionStorage.clear();
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

  it("uses the dedicated fullscreen auth layout without the old auth navigation", () => {
    render(
      <AuthLayout>
        <div>Auth canvas</div>
      </AuthLayout>
    );

    expect(screen.getByText("Auth canvas")).toBeInTheDocument();
    expect(screen.queryByText("Kembali ke beranda")).not.toBeInTheDocument();
    expect(screen.queryByText("Akses aman untuk pembeli")).not.toBeInTheDocument();
  });

  it("shows a fullscreen success transition before entering the dashboard", async () => {
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
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Login Berhasil");
      expect(status).toHaveTextContent("Akun Anda siap digunakan");
      expect(status).toHaveTextContent("kami sedang mengarahkan Anda");
      expect(status).toHaveClass("auth-success-stage");
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /login berhasil/i })).toBeDisabled();
    });
    await waitFor(() => {
      expect(navigationMocks.push).toHaveBeenCalledWith("/dashboard");
    }, { timeout: 2600 });
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

  it("shows compact Level 3 suspension details with the recovery time", async () => {
    authMocks.signInEmail.mockResolvedValue({
      error: {
        message:
          "Akun Anda ditangguhkan karena akumulasi 3 pelanggaran tidak membayar lelang yang dimenangkan. Akses login dibuka kembali pada 15 Jul 2027, 07.00 WIB."
      }
    });

    renderWithToast(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email akun/i), {
      target: {
        value: "tiara@gmail.com"
      }
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i, { selector: "input" }), {
      target: {
        value: "password-rahasia"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /^masuk$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Akun ditangguhkan Level 3");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "akumulasi 3 pelanggaran tidak membayar lelang yang dimenangkan"
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Akses login dibuka kembali pada 15 Jul 2027, 07.00 WIB.");
  });

  it("uses the register visual feedback and password reveal interaction", async () => {
    authMocks.signUpEmail.mockResolvedValue({
      error: {
        message: "Email sudah terdaftar"
      }
    });

    renderWithToast(<RegisterForm />);

    expect(screen.queryByText(/data identitas anda digunakan secara aman/i)).not.toBeInTheDocument();

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
      phoneNumber: "081200009999"
    });
  });

  it("uses a dedicated logout transition instead of the regular activity toast", async () => {
    window.sessionStorage.setItem(BUYER_VIEWER_CACHE_KEY, "{\"name\":\"Raras\"}");
    renderWithToast(<LogoutButton>Keluar</LogoutButton>);

    fireEvent.click(screen.getByRole("button", { name: /keluar/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    });
    expect(window.sessionStorage.getItem(BUYER_VIEWER_CACHE_KEY)).toBeNull();

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Logout Berhasil");
    expect(status).toHaveTextContent("Sesi Anda sudah ditutup dengan aman");
    expect(status).toHaveTextContent("Sampai jumpa kembali");
    expect(status).toHaveClass("auth-logout-stage");
    expect(status.parentElement).toBe(document.body);
    await waitFor(() => {
      expect(navigationMocks.push).toHaveBeenCalledWith("/login");
    }, { timeout: 1800 });
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });
});
