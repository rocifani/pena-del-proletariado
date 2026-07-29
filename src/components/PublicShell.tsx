"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Ranking", href: "/ranking" },
  { label: "Fechas", href: "/fechas" },
  { label: "Jugadores", href: "/jugadores" },
  { label: "Torneos", href: "/torneos" },
];

export default function PublicShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const pathname = usePathname() || "/";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          {/* Fila superior */}
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <Image
                src="/assets/img/logo.png"
                alt=""
                width={36}
                height={44}
                priority
                className="h-9 w-auto shrink-0"
              />
              <span className="truncate text-base font-bold leading-tight text-gray-900 dark:text-gray-100 sm:text-lg">
                Peña del Proletariado
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <Link
                href={isAdmin ? "/admin" : "/login"}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold
                           text-brand-500 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-gray-800"
              >
                {isAdmin ? "Admin" : "Ingresar"}
              </Link>
            </div>
          </div>

          {/* Nav: scroll horizontal en mobile, fija en desktop */}
          <nav
            aria-label="Navegación principal"
            className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0
                       [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-brand-400 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-gray-200 py-6 dark:border-gray-700">
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Peña del Proletariado · Truco
        </p>
      </footer>
    </div>
  );
}
