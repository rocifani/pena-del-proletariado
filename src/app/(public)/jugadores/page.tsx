import { EmptyState, PageHeader, Badge } from "@/components/ui";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Player } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jugadores" };

export default async function JugadoresPublicPage() {
  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase
    .from("players")
    .select("id, display_name, active, notes, created_at, updated_at")
    .order("display_name", { ascending: true });

  const players = (data as Player[] | null) ?? [];
  const activos = players.filter((p) => p.active);
  const inactivos = players.filter((p) => !p.active);

  if (players.length === 0) {
    return (
      <div>
        <PageHeader title="Jugadores" />
        <EmptyState title="Todavía no hay jugadores cargados" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Jugadores"
        subtitle={`${activos.length} activo${activos.length === 1 ? "" : "s"}${
          inactivos.length ? ` · ${inactivos.length} inactivo${inactivos.length === 1 ? "" : "s"}` : ""
        }`}
      />

      <ul className="grid gap-2 sm:grid-cols-2">
        {players.map((p) => (
          <li key={p.id} className="card flex items-center gap-3 px-4 py-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                         bg-brand-100 text-sm font-bold text-brand-700
                         dark:bg-brand-800 dark:text-brand-100"
              aria-hidden="true"
            >
              {p.display_name.trim().charAt(0).toUpperCase()}
            </span>

            <span className="min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-gray-100">
              {p.display_name}
            </span>

            {!p.active && <Badge tone="neutral">Inactivo</Badge>}
          </li>
        ))}
      </ul>
    </div>
  );
}
