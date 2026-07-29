"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  IconCalendar,
  IconClose,
  IconHome,
  IconLogout,
  IconMenu,
  IconTrophy,
  IconUsers,
} from "@/components/icons";

type NavItem = { label: string; href: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { label: "Panel", href: "/admin", icon: <IconHome /> },
  { label: "Jugadores", href: "/admin/jugadores", icon: <IconUsers /> },
  { label: "Torneos", href: "/admin/torneos", icon: <IconTrophy /> },
  { label: "Fechas", href: "/admin/fechas", icon: <IconCalendar /> },
];

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname() || "/admin";
  const [open, setOpen] = useState(false);

  // Cerrar el drawer al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquear el scroll del body con el drawer abierto (mobile)
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Backdrop mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: fijo en desktop, drawer en mobile */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-y-auto",
          "border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
            <Image
              src="/assets/img/logo.png"
              alt=""
              width={32}
              height={39}
              className="h-8 w-auto shrink-0"
            />
            <span className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              Peña del Proletariado
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
          >
            <IconClose />
          </button>
        </div>

        <nav className="px-3 pb-6" aria-label="Navegación de administración">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700 dark:bg-gray-700 dark:text-brand-200"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    ].join(" ")}
                  >
                    <span className={active ? "text-brand-500 dark:text-brand-300" : ""}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <hr className="my-4 border-gray-200 dark:border-gray-700" />

          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium
                       text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Ver sitio público
          </Link>
        </nav>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
            >
              <IconMenu />
            </button>

            <div className="flex-1" />

            <span className="hidden max-w-[16rem] truncate text-sm text-gray-500 dark:text-gray-400 sm:block">
              {userEmail}
            </span>

            <ThemeToggle />

            <form action="/logout" method="post">
              <button
                type="submit"
                title="Cerrar sesión"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold
                           text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <IconLogout />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
