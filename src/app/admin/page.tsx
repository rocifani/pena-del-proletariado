import Link from "next/link";
import { PageHeader, Badge } from "@/components/ui";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import { getActiveTournamentSummary } from "@/lib/queries";
import { num } from "@/lib/format";
import { IconCalendar, IconTrophy, IconUsers } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel" };

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerReadOnly();

  const [{ count: totalJugadores }, { count: jugadoresActivos }, torneo] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase.from("players").select("id", { count: "exact", head: true }).eq("active", true),
    getActiveTournamentSummary(),
  ]);

  return (
    <div>
      <PageHeader title="Panel" subtitle="Administración de la peña" />

      {/* Torneo activo */}
      <section className="card mb-6 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Torneo en curso</h2>
          {torneo ? <Badge tone="brand">Activo</Badge> : <Badge tone="neutral">Ninguno</Badge>}
        </div>

        {torneo ? (
          <>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {torneo.tournament_name}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {torneo.completed_matchdays} fecha
              {torneo.completed_matchdays === 1 ? "" : "s"} · {torneo.participant_count} jugadores
              {torneo.leader_name && (
                <>
                  {" · Puntero: "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {torneo.leader_name}
                  </span>{" "}
                  ({num(torneo.leader_points)} pts)
                </>
              )}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No hay ningún torneo activo. Creá uno para empezar a cargar fechas.
          </p>
        )}
      </section>

      {/* Accesos */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/jugadores" className="card px-4 py-4 hover:border-brand-300">
          <span className="text-brand-500 dark:text-brand-300">
            <IconUsers />
          </span>
          <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">Jugadores</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {jugadoresActivos ?? 0} activos de {totalJugadores ?? 0}
          </p>
        </Link>

        <Link href="/admin/torneos" className="card px-4 py-4 hover:border-brand-300">
          <span className="text-brand-500 dark:text-brand-300">
            <IconTrophy />
          </span>
          <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">Torneos</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Crear, configurar y cerrar
          </p>
        </Link>

        <Link href="/admin/fechas" className="card px-4 py-4 hover:border-brand-300">
          <span className="text-brand-500 dark:text-brand-300">
            <IconCalendar />
          </span>
          <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">Fechas</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Cargar resultados de cada juntada
          </p>
        </Link>
      </section>
    </div>
  );
}
