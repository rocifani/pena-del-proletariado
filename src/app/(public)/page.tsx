import Link from "next/link";
import StandingsTable from "@/components/StandingsTable";
import { EmptyState } from "@/components/ui";
import { getActiveTournamentSummary, getStandings } from "@/lib/queries";
import { fecha, num } from "@/lib/format";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card px-3 py-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default async function HomePage() {
  const torneo = await getActiveTournamentSummary();

  if (!torneo) {
    return (
      <EmptyState
        title="No hay ningún torneo en curso"
        description="Cuando el administrador active un torneo, acá van a aparecer la tabla y las fechas."
        action={
          <Link href="/torneos" className="btn btn-secondary">
            Ver torneos anteriores
          </Link>
        }
      />
    );
  }

  const standings = await getStandings(torneo.tournament_id);
  const top = standings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Encabezado del torneo */}
      <section className="rounded-xl bg-brand-400 px-4 py-5 text-white sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
          Torneo en curso
        </p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{torneo.tournament_name}</h1>

        {torneo.description && (
          <p className="mt-1 text-sm text-white/80">{torneo.description}</p>
        )}

        {torneo.start_date && (
          <p className="mt-1 text-sm text-white/80">
            Desde el {fecha(torneo.start_date)}
            {torneo.end_date && <> hasta el {fecha(torneo.end_date)}</>}
          </p>
        )}

        {torneo.leader_name && (
          <p className="mt-3 text-sm">
            <span className="text-white/75">Puntero: </span>
            <span className="font-bold">{torneo.leader_name}</span>
            <span className="text-white/75"> · {num(torneo.leader_points)} puntos</span>
          </p>
        )}
      </section>

      {/* Numeritos */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Fechas" value={torneo.completed_matchdays} />
        <StatCard label="Jugadores" value={torneo.participant_count} />
        <StatCard label="Partidos" value={torneo.total_matches_registered} />
      </section>

      {/* Top 5 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tabla general</h2>
          {standings.length > top.length && (
            <Link
              href="/ranking"
              className="text-sm font-semibold text-brand-500 hover:underline dark:text-brand-300"
            >
              Ver completa
            </Link>
          )}
        </div>

        <StandingsTable rows={top} />
      </section>

      {/* Accesos */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/fechas" className="card px-4 py-4 hover:border-brand-300">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Fechas</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Resultados de cada juntada
          </p>
        </Link>
        <Link href="/jugadores" className="card px-4 py-4 hover:border-brand-300">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Jugadores</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Quiénes son parte de la peña
          </p>
        </Link>
      </section>
    </div>
  );
}
