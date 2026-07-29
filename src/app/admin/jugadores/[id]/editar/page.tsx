import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import PlayerForm from "@/components/PlayerForm";
import SubmitButton from "@/components/SubmitButton";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Player } from "@/lib/types";
import { editarJugadorAction, eliminarJugadorAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar jugador" };

export default async function EditarJugadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase
    .from("players")
    .select("id, display_name, active, notes, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const player = data as Player;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Editar jugador" subtitle={player.display_name} />

      <PlayerForm action={editarJugadorAction} player={player} error={sp.error ?? null} />

      {/* Zona de riesgo */}
      <div className="mt-6 rounded-xl border border-red-200 px-4 py-4 dark:border-red-900">
        <h2 className="font-semibold text-red-700 dark:text-red-300">Eliminar jugador</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Solo se puede eliminar si nunca participó en una fecha. Si ya tiene resultados,
          desactivalo en lugar de borrarlo.
        </p>

        <form action={eliminarJugadorAction} className="mt-3">
          <input type="hidden" name="id" value={player.id} />
          <input type="hidden" name="nombre" value={player.display_name} />
          <SubmitButton
            idleText="Eliminar"
            loadingText="Eliminando..."
            className="btn btn-danger"
            confirmTitle={`Eliminar a ${player.display_name}`}
            confirmText="Eliminar"
            confirmMessage="Se borra el jugador definitivamente. Esta acción no se puede deshacer. Si alguna vez participó de una fecha, la base va a rechazar el borrado: en ese caso desactivalo."
          />
        </form>
      </div>
    </div>
  );
}
