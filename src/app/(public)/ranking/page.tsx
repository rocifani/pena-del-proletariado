import StandingsTable from "@/components/StandingsTable";
import { EmptyState, PageHeader } from "@/components/ui";
import { getActiveTournamentSummary, getStandings } from "@/lib/queries";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking" };

export default async function RankingPage() {
  const torneo = await getActiveTournamentSummary();

  if (!torneo) {
    return (
      <EmptyState
        title="No hay torneo en curso"
        description="El ranking aparece cuando hay un torneo activo con fechas cargadas."
      />
    );
  }

  const standings = await getStandings(torneo.tournament_id);

  return (
    <div>
      <PageHeader title="Tabla general" subtitle={torneo.tournament_name} />

      <StandingsTable rows={standings} />

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Puntaje: {num(torneo.completed_matchdays)} fecha
        {torneo.completed_matchdays === 1 ? "" : "s"} computada
        {torneo.completed_matchdays === 1 ? "" : "s"}. En caso de empate se ordena por partidos
        ganados, porcentaje de victorias y fechas asistidas.
      </p>
    </div>
  );
}
