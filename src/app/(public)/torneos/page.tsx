import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { TournamentSummary } from "@/lib/types";
import { fecha, num } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Torneos" };

const ESTADOS: Record<string, { label: string; tone: "brand" | "green" | "neutral" | "red" }> = {
  active: { label: "En curso", tone: "brand" },
  finished: { label: "Finalizado", tone: "green" },
  draft: { label: "Borrador", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "red" },
};

export default async function TorneosPage() {
  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase
    .from("tournament_summary")
    .select("*")
    .neq("status", "draft")
    .order("start_date", { ascending: false, nullsFirst: false });

  const torneos = (data as TournamentSummary[] | null) ?? [];

  if (torneos.length === 0) {
    return (
      <div>
        <PageHeader title="Torneos" />
        <EmptyState title="Todavía no hay torneos" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Torneos" subtitle="Historial de la peña" />

      <ul className="space-y-3">
        {torneos.map((t) => {
          const estado = ESTADOS[t.status] ?? ESTADOS.draft;

          return (
            <li key={t.tournament_id}>
              <Link
                href={`/torneos/${t.tournament_id}`}
                className="card block px-4 py-4 transition-colors hover:border-brand-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-bold text-gray-900 dark:text-gray-100">
                    {t.tournament_name}
                  </h2>
                  <Badge tone={estado.tone}>{estado.label}</Badge>
                </div>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {fecha(t.start_date)}
                  {t.end_date ? ` — ${fecha(t.end_date)}` : ""}
                  {" · "}
                  {t.completed_matchdays} fecha{t.completed_matchdays === 1 ? "" : "s"}
                  {" · "}
                  {t.participant_count} jugador{t.participant_count === 1 ? "" : "es"}
                </p>

                {t.status === "finished" && t.winner_name && (
                  <p className="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-300">
                    🏆 Campeón: {t.winner_name}
                  </p>
                )}

                {t.status === "active" && t.leader_name && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    Puntero: <span className="font-semibold">{t.leader_name}</span> ·{" "}
                    {num(t.leader_points)} puntos
                  </p>
                )}

                <p className="mt-2 text-sm font-semibold text-brand-500 dark:text-brand-300">
                  Ver detalle →
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
