import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold text-brand-400">404</p>
      <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        No encontramos esta página
      </h1>
      <Link href="/" className="btn btn-primary mt-6">
        Volver al inicio
      </Link>
    </main>
  );
}
