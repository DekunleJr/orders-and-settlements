"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M6 4h4l2-3h6l2 3H6z" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Sign in to your account
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
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 text-gray-900 placeholder-gray-500 border-0 border-b-2 border-gray-300 focus:text-gray-900 focus:outline-none focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />

          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
            New here?
          </span>

          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <UserPlus className="h-4 w-4" />
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}