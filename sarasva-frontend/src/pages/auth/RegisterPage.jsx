import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.js";

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:     "",
    email:    "",
    password: "",
    course:   "",
    semester: "",
  });
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Sarasva</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your account</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.36 3.02 29.47 1 24 1 14.82 1 7.07 6.49 3.56 14.27l7.1 5.52C12.38 13.68 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.52 24.5c0-1.56-.14-3.06-.4-4.5H24v8.5h12.67c-.55 2.9-2.2 5.36-4.67 7.01l7.27 5.65C43.27 37.19 46.52 31.31 46.52 24.5z"/>
              <path fill="#FBBC05" d="M10.66 28.79A14.5 14.5 0 0 1 9.5 24c0-1.66.29-3.27.79-4.79l-7.1-5.52A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.56 10.77l8.1-5.98z"/>
              <path fill="#34A853" d="M24 47c5.47 0 10.07-1.81 13.43-4.91l-7.27-5.65c-1.88 1.26-4.28 2.06-6.16 2.06-6.26 0-11.62-4.18-13.34-9.79l-8.1 5.98C7.07 41.51 14.82 47 24 47z"/>
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">Full name</label>
              <input
                id="name" name="name" type="text"
                required value={form.name} onChange={handleChange}
                placeholder="Arjun Sharma"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email" name="email" type="email"
                required value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password" name="password" type="password"
                required value={form.password} onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              />
            </div>

            {/* Course + Semester (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="course" className="text-sm font-medium">
                  Course <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="course" name="course" type="text"
                  value={form.course} onChange={handleChange}
                  placeholder="B.Tech"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="semester" className="text-sm font-medium">
                  Semester <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="semester" name="semester" type="text"
                  value={form.semester} onChange={handleChange}
                  placeholder="Sem 4"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
