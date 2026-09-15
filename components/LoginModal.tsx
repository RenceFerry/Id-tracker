"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginModal() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError("Incorrect email or password.");
      return;
    }
    setEmail("");
    setPassword("");
    router.push('/');
  }

  const inputClass =
    "w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:bg-surface transition-colors";
  const labelClass = "text-xs uppercase tracking-wide text-muted mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-line max-w-sm w-full p-5 space-y-4"
      >
        <h3 className="font-serif text-lg text-ink">Admin sign in</h3>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            autoFocus
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-maroon">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 text-sm text-muted hover:text-ink transition-colors"
          >
            <Link href={'/'}>
              Cancel
            </Link>
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-maroon text-paper px-4 py-2 text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
