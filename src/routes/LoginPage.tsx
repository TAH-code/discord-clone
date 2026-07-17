import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect } from "react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signIn" | "signUp">("signUp");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", {
        email,
        password,
        flow: mode,
        ...(mode === "signUp" ? { name } : {}),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-neutral-900">
          {mode === "signUp" ? "Create an account" : "Welcome back"}
        </h1>
        <p className="mb-6 text-sm text-neutral-400">
          {mode === "signUp"
            ? "Sign up to start chatting."
            : "Log in to continue."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signUp" && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
                Display name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md bg-neutral-50 px-3 py-2 text-neutral-900 outline-none ring-1 ring-neutral-200 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-neutral-50 px-3 py-2 text-neutral-900 outline-none ring-1 ring-neutral-200 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-neutral-50 px-3 py-2 text-neutral-900 outline-none ring-1 ring-neutral-200 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting
              ? "Please wait…"
              : mode === "signUp"
                ? "Sign up"
                : "Log in"}
          </button>
        </form>

        <button
          onClick={() => {
            setError(null);
            setMode(mode === "signUp" ? "signIn" : "signUp");
          }}
          className="mt-4 w-full text-center text-sm text-neutral-400 hover:text-neutral-900"
        >
          {mode === "signUp"
            ? "Already have an account? Log in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
