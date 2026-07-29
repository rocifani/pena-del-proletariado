import { PageHeader } from "@/components/ui";
import TournamentForm from "@/components/TournamentForm";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Tournament } from "@/lib/types";
import { crearTorneoAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo torneo" };

export default async function NuevoTorneoPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};

  // Copiamos el puntaje del último torneo creado, como sugerencia.
  const supabase = await createSupabaseServerReadOnly();
  const { data } = await supabase
    .from("tournaments")
    .select("points_per_win, points_per_loss, minimum_points_per_matchday")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const anterior = (data as Partial<Tournament> | null) ?? undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nuevo torneo"
        subtitle={
          anterior
            ? "El puntaje viene precargado con el del torneo anterior. Podés cambiarlo."
            : "Se crea en borrador: podés configurarlo tranquilo antes de activarlo."
        }
      />
      <TournamentForm action={crearTorneoAction} error={sp.error ?? null} defaults={anterior} />
    </div>
  );
}
