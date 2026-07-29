import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Standing, TournamentSummary } from "@/lib/types";

/** Devuelve el resumen del torneo activo, o null si no hay ninguno. */
export async function getActiveTournamentSummary(): Promise<TournamentSummary | null> {
  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase
    .from("tournament_summary")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  return (data as TournamentSummary | null) ?? null;
}

/** Devuelve la tabla general de un torneo, ya ordenada por posición. */
export async function getStandings(tournamentId: string): Promise<Standing[]> {
  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase
    .from("tournament_standings")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("position", { ascending: true });

  return (data as Standing[] | null) ?? [];
}
