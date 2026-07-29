"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import ThemeToggle from "@/components/ThemeToggle";

function LoginForm() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setError(
        error.message === "Invalid login credentials"
          ? "Mail o contraseña incorrectos."
          : error.message
      );
      return;
    }

    // refresh() para que el middleware vea la cookie nueva
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="form-label">
          Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="form-input"
          placeholder="admin@penadelproletariado.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="password" className="form-label">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="form-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700
                     dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            aria-hidden="true"
          />
        )}
        {loading ? "Entrando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-sm flex-col">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>

        <div className="card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image
              src="/assets/img/logo.png"
              alt="Peña del Proletariado"
              width={128}
              height={158}
              priority
              className="h-28 w-auto"
            />
            <h1 className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              Peña del Proletariado
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Acceso de administración
            </p>
          </div>

          <Suspense fallback={<p className="text-sm text-gray-500">Cargando...</p>}>
            <LoginForm />
          </Suspense>
        </div>

        <Link
          href="/"
          className="mx-auto mt-6 text-sm font-medium text-brand-500 hover:underline dark:text-brand-300"
        >
          ← Volver al sitio
        </Link>
      </div>
    </main>
  );
}
