import { EmptyState, PageHeader, Badge } from "@/components/ui";
import { getActiveTournamentSummary } from "@/lib/queries";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { MatchdayResultWithPoints } from "@/lib/types";
import { fecha, num } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fechas" };

export default async function JornadasPage() {
  const torneo = await getActiveTournamentSummary();

  if (!torneo) {
    return (
      <EmptyState
        title="No hay torneo en curso"
        description="Las fechas del torneo activo se muestran acá."
      />
    );
  }

  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase
    .from("matchday_results_with_points")
    .select("*")
    .eq("tournament_id", torneo.tournament_id)
    .eq("matchday_status", "completed")
    .order("matchday_number", { ascending: false })
    .order("points", { ascending: false });

  const rows = (data as MatchdayResultWithPoints[] | null) ?? [];

  // Agrupamos por fecha manteniendo el orden que vino de la base
  const fechas = new Map<number, MatchdayResultWithPoints[]>();
  for (const r of rows) {
    const list = fechas.get(r.matchday_number) ?? [];
    list.push(r);
    fechas.set(r.matchday_number, list);
  }

  if (fechas.size === 0) {
    return (
      <div>
        <PageHeader title="Fechas" subtitle={torneo.tournament_name} />
        <EmptyState
          title="Todavía no hay fechas completadas"
          description="Cuando se cargue y complete la primera juntada, va a aparecer acá."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Fechas" subtitle={torneo.tournament_name} />

      <div className="space-y-4">
        {[...fechas.entries()].map(([numero, resultados]) => (
          <section key={numero} className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 dark:text-gray-100">Fecha {numero}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {fecha(resultados[0]?.played_at)}
                </p>
              </div>
              <Badge tone="brand">{resultados.length} jugadores</Badge>
            </div>

            {resultados[0]?.matchday_notes && (
              <p className="border-b border-gray-100 bg-brand-50 px-4 py-2 text-sm italic text-gray-700 dark:border-gray-700 dark:bg-gray-700/30 dark:text-gray-300">
                "{resultados[0].matchday_notes}"
              </p>
            )}

            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {resultados.map((r) => (
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
          </section>
        ))}
      </div>
    </div>
  );
}
