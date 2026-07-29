import { PageHeader } from "@/components/ui";
import PlayerForm from "@/components/PlayerForm";
import { crearJugadorAction } from "../actions";

export const metadata = { title: "Nuevo jugador" };

export default async function NuevoJugadorPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; nombre?: string }>;
}) {
  const sp = (await searchParams) ?? {};

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nuevo jugador" />
      <PlayerForm
        action={crearJugadorAction}
        error={sp.error ?? null}
        defaultName={sp.nombre}
      />
    </div>
  );
}
