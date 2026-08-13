import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@/components/ui";
import StandingsTable from "@/components/StandingsTable";
import { TournamentStatusBadge } from "@/components/TournamentStatusBadge";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { MatchdayResultWithPoints, Standing, Tournament } from "@/lib/types";
import { fecha, num, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase
    .from("tournaments")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return { title: (data as { name: string } | null)?.name ?? "Torneo" };
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</dd>
    </div>
  );
}

export default async function TorneoPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerReadOnly();

  const { data: torneoData } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!torneoData) notFound();
  const torneo = torneoData as Tournament;

  // Los borradores no son públicos
  if (torneo.status === "draft") notFound();

  const [{ data: standingsData }, { data: resultadosData }] = await Promise.all([
    supabase
      .from("tournament_standings")
      .select("*")
      .eq("tournament_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("matchday_results_with_points")
      .select("*")
      .eq("tournament_id", id)
      .eq("matchday_status", "completed")
      .order("matchday_number", { ascending: false })
      .order("points", { ascending: false }),
  ]);

  const standings = (standingsData as Standing[] | null) ?? [];
  const resultados = (resultadosData as MatchdayResultWithPoints[] | null) ?? [];

  let campeon: string | null = null;
  if (torneo.winner_player_id) {
    const { data } = await supabase
      .from("players")
      .select("display_name")
      .eq("id", torneo.winner_player_id)
      .maybeSingle();

    campeon = (data as { display_name: string } | null)?.display_name ?? null;
  }

  // Agrupamos los resultados por fecha, respetando el orden que trajo la base
  const porFecha = new Map<number, MatchdayResultWithPoints[]>();
  for (const r of resultados) {
    const lista = porFecha.get(r.matchday_number) ?? [];
    lista.push(r);
    porFecha.set(r.matchday_number, lista);
  }

  // Todos los jugadores de una fecha compiten en los mismos partidos, así que
  // la cantidad real jugada esa fecha es el máximo entre jugadores, no la suma.
  const totalPartidos = [...porFecha.values()].reduce(
    (acc, filas) => acc + Math.max(...filas.map((r) => r.total_matches)),
    0
  );
  const lider = standings[0] ?? null;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/torneos"
          className="text-sm font-medium text-brand-500 hover:underline dark:text-brand-300"
        >
          ← Torneos
        </Link>
      </div>

      <PageHeader
        title={torneo.name}
        subtitle={torneo.description ?? undefined}
        action={<TournamentStatusBadge status={torneo.status} />}
      />

      {/* Campeón o puntero */}
      {torneo.status === "finished" && campeon ? (
        <section className="mb-5 rounded-xl bg-brand-400 px-4 py-5 text-white sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Campeón</p>
          <p className="mt-0.5 text-2xl font-bold">🏆 {campeon}</p>
          {standings[0] && (
            <p className="mt-1 text-sm text-white/80">
              {num(standings[0].total_points)} puntos · {standings[0].matches_won} partidos
              ganados · {standings[0].matchdays_played} fechas
            </p>
          )}
        </section>
      ) : (
        torneo.status === "active" &&
        lider && (
          <section className="mb-5 rounded-xl bg-brand-400 px-4 py-5 text-white sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
              Puntero
            </p>
            <p className="mt-0.5 text-2xl font-bold">{lider.player_name}</p>
            <p className="mt-1 text-sm text-white/80">
              {num(lider.total_points)} puntos · {lider.matchdays_played} fechas
            </p>
          </section>
        )
      )}

      {/* Datos del torneo */}
      <section className="card mb-6 px-4 py-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100">Datos del torneo</h2>

        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Dato label="Inicio" value={fecha(torneo.start_date)} />
          <Dato label="Fin" value={fecha(torneo.end_date)} />
          <Dato label="Fechas jugadas" value={porFecha.size} />
          <Dato label="Jugadores" value={standings.length} />
          <Dato label="Partidos" value={totalPartidos} />
          <Dato
            label="Puntaje"
            value={`${num(torneo.points_per_win)} / ${num(torneo.points_per_loss)} · mín ${num(
              torneo.minimum_points_per_matchday
            )}`}
          />
        </dl>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          El puntaje se lee como: puntos por partido ganado / por partido perdido, y el mínimo
          que se lleva cualquiera que haya jugado la fecha.
        </p>
      </section>

      {/* Tabla general */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
          {torneo.status === "finished" ? "Tabla final" : "Tabla general"}
        </h2>
        <StandingsTable rows={standings} />
      </section>

      {/* Fechas */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">Fechas</h2>

        {porFecha.size === 0 ? (
          <p className="card px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Este torneo no tiene fechas completadas.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...porFecha.entries()].map(([numero, filas]) => (
              <li key={numero}>
                <details className="card group overflow-hidden">
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3
                               hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900 dark:text-gray-100">
                        Fecha {numero}
                      </span>
                      <span className="block text-sm text-gray-500 dark:text-gray-400">
                        {fecha(filas[0]?.played_at)} · {filas.length} jugador
                        {filas.length === 1 ? "" : "es"}
                      </span>
                      {filas[0]?.matchday_notes && (
                        <span className="mt-0.5 block text-sm italic text-gray-600 dark:text-gray-300">
                          "{filas[0].matchday_notes}"
                        </span>
                      )}
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone="brand">{filas[0]?.player_name}</Badge>
                      <svg
                        className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </summary>

                  <div className="border-t border-gray-100 dark:border-gray-700">
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filas.map((r) => (
                        <li key={r.player_id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                            {r.player_name}
                          </span>
                          <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                            {r.matches_won}G · {r.matches_lost}P
                          </span>
                          <span className="w-14 shrink-0 text-right text-sm font-bold text-brand-500 dark:text-brand-300">
                            {num(r.points)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}

        {porFecha.size > 0 && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Tocá una fecha para ver el detalle. La etiqueta muestra quién hizo más puntos ese
            día.
          </p>
        )}
      </section>

      {/* Jugador con mejor promedio, un dato lindo para cerrar */}
      {standings.length > 1 && (
        <section className="mt-6 card px-4 py-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Algunos números</h2>

          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Dato
              label="Mejor promedio"
              value={(() => {
                const mejor = [...standings].sort(
                  (a, b) => (b.average_points ?? 0) - (a.average_points ?? 0)
                )[0];
                return `${mejor.player_name} (${num(mejor.average_points)})`;
              })()}
            />
            <Dato
              label="Mejor % de victorias"
              value={(() => {
                const mejor = [...standings].sort(
                  (a, b) => (b.win_percentage ?? 0) - (a.win_percentage ?? 0)
                )[0];
                return `${mejor.player_name} (${pct(mejor.win_percentage)})`;
              })()}
            />
            <Dato
              label="Más presente"
              value={(() => {
                const mejor = [...standings].sort(
                  (a, b) => b.matchdays_played - a.matchdays_played
                )[0];
                return `${mejor.player_name} (${mejor.matchdays_played})`;
              })()}
            />
          </dl>
        </section>
      )}
    </div>
  );
}
