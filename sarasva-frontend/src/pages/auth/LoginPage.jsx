import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.js";
import { authService } from "@/services/auth.service.js";

export default function LoginPage() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form,          setForm]          = useState({ email: "", password: "" });
  const [error,         setError]         = useState("");
  const [message,       setMessage]       = useState("");
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (user) {
    navigate(location.state?.from || "/dashboard", { replace: true });
    return null;
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(""); setMessage(""); setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!form.email) { setError("Please enter your email to reset your password."); return; }
    setError(""); setMessage("");
    try {
      await authService.resetPassword(form.email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">

      {/* Soft gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">

        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl scale-110" />
            <img
              src="/SARASVA/logo.png"
              alt="Sarasva"
              className="relative h-16 w-16 rounded-2xl shadow-lg object-contain"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Sarasva</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your academic companion</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow-md space-y-4">

          {error && (
            <div className="animate-slide-down rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive border border-destructive/15">
              {error}
            </div>
          )}
          {message && (
            <div className="animate-slide-down rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 border border-emerald-500/20">
              {message}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.36 3.02 29.47 1 24 1 14.82 1 7.07 6.49 3.56 14.27l7.1 5.52C12.38 13.68 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.52 24.5c0-1.56-.14-3.06-.4-4.5H24v8.5h12.67c-.55 2.9-2.2 5.36-4.67 7.01l7.27 5.65C43.27 37.19 46.52 31.31 46.52 24.5z"/>
              <path fill="#FBBC05" d="M10.66 28.79A14.5 14.5 0 0 1 9.5 24c0-1.66.29-3.27.79-4.79l-7.1-5.52A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.56 10.77l8.1-5.98z"/>
              <path fill="#34A853" d="M24 47c5.47 0 10.07-1.81 13.43-4.91l-7.27-5.65c-1.88 1.26-4.28 2.06-6.16 2.06-6.26 0-11.62-4.18-13.34-9.79l-8.1 5.98C7.07 41.51 14.82 47 24 47z"/>
            </svg>
            {googleLoading ? "Signing in…" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or sign in with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <button
                  type="button" onClick={handleForgotPassword}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password" name="password" type="password"
                autoComplete="current-password" required
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
