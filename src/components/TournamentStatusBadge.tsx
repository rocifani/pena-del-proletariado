import { Badge } from "@/components/ui";
import type { MatchdayStatus, TournamentStatus } from "@/lib/types";

const TORNEO = {
  draft: { label: "Borrador", tone: "neutral" },
  active: { label: "En curso", tone: "brand" },
  finished: { label: "Finalizado", tone: "green" },
  cancelled: { label: "Cancelado", tone: "red" },
} as const;

const JORNADA = {
  draft: { label: "Borrador", tone: "amber" },
  completed: { label: "Completada", tone: "green" },
  cancelled: { label: "Cancelada", tone: "red" },
} as const;

export function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const e = TORNEO[status] ?? TORNEO.draft;
  return <Badge tone={e.tone}>{e.label}</Badge>;
}

export function MatchdayStatusBadge({ status }: { status: MatchdayStatus }) {
  const e = JORNADA[status] ?? JORNADA.draft;
  return <Badge tone={e.tone}>{e.label}</Badge>;
}
