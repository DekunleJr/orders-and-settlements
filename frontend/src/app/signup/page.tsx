"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogIn } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await signup(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100/50 backdrop-blur-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 mb-4">
            <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 01-4 4v10m3-8v10M6.25 6a5 5 0 119.53 2.061.5.5.5 0 01.069-1.06L6.25 6zm12.47 9-.653-.653m12.44 0a9 9 0 01-8.48 2.553l.653.653M2.869.85a9 9 0 1112.73 0L20.13 21H2v-2.869a9 9 0 00-5.848-4.297Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create your account
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm bg-white/50 px-4 py-3 border border-gray-100/20">
            <div>
              <label htmlFor="email" className="sr-only text-xs text-gray-500 font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 text-gray-900 placeholder-gray-500 border-0 border-b-2 border-gray-300 focus:text-gray-900 focus:outline-none focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="rounded-md shadow-sm bg-white/50 px-4 py-3 border border-gray-100/20">
            <div>
              <label htmlFor="password" className="sr-only text-xs text-gray-500 font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 text-gray-900 placeholder-gray-500 border-0 border-b-2 border-gray-300 focus:text-gray-900 focus:outline-none focus:border-blue-500 sm:text-sm"
                placeholder="Password (min 6 characters)"
              />
            </div>
          </div>

          <div className="rounded-md shadow-sm bg-white/50 px-4 py-3 border border-gray-100/20">
            <div>
              <label htmlFor="confirmPassword" className="sr-only text-xs text-gray-500 font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 text-gray-900 placeholder-gray-500 border-0 border-b-2 border-gray-300 focus:text-gray-900 focus:outline-none focus:border-blue-500 sm:text-sm"
                placeholder="Confirm password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-100 p-3 text-red-700 text-sm">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        {/* <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Or{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-600 underline"
            >
              Sign in to existing account
            </Link>
          </p>
        </div> */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />

          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Already a member?
          </span>

          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <LogIn className="h-4 w-4" />
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}