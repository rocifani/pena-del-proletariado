import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErrorBox, PageHeader } from "@/components/ui";
import StandingsTable from "@/components/StandingsTable";
import SubmitButton from "@/components/SubmitButton";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Standing, Tournament } from "@/lib/types";
import { num } from "@/lib/format";
import { cerrarTorneoAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cerrar torneo" };

export default async function CerrarTorneoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  const supabase = await createSupabaseServerReadOnly();

  const { data: torneoData } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!torneoData) notFound();
  const torneo = torneoData as Tournament;

  if (torneo.status !== "active") {
    redirect(
      `/admin/torneos/${id}?error=${encodeURIComponent("Solo se puede cerrar un torneo en curso.")}`
    );
  }

  const { data: standingsData } = await supabase
    .from("tournament_standings")
    .select("*")
    .eq("tournament_id", id)
    .order("position", { ascending: true });

  const standings = (standingsData as Standing[] | null) ?? [];
  const campeon = standings[0] ?? null;

  const { count: pendientes } = await supabase
    .from("matchdays")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", id)
    .eq("status", "draft");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href={`/admin/torneos/${id}`}
          className="text-sm font-medium text-brand-500 hover:underline dark:text-brand-300"
        >
          ← {torneo.name}
        </Link>
      </div>

      <PageHeader
        title="Cerrar torneo"
        subtitle="Revisá la tabla final antes de confirmar. Después del cierre no se pueden modificar resultados ni parámetros."
      />

      {sp.error && (
        <div className="mb-4">
          <ErrorBox message={sp.error} />
        </div>
      )}

      {!campeon ? (
        <div className="card px-4 py-6 text-center">
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            No hay fechas completadas
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Para cerrar el torneo tiene que haber al menos una fecha en estado completada.
          </p>
          <Link href="/admin/fechas" className="btn btn-primary mt-4">
            Ir a fechas
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-xl bg-brand-400 px-4 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
              Campeón propuesto
            </p>
            <p className="mt-0.5 text-2xl font-bold">🏆 {campeon.player_name}</p>
            <p className="mt-1 text-sm text-white/80">
              {num(campeon.total_points)} puntos · {campeon.matches_won} partidos ganados ·{" "}
              {campeon.matchdays_played} fechas
            </p>
          </div>

          {(pendientes ?? 0) > 0 && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Atención: hay {pendientes} fecha{pendientes === 1 ? "" : "s"} en borrador que no
              se está{pendientes === 1 ? "" : "n"} contando. Completalas o cancelalas antes de
              cerrar si corresponde.
            </p>
          )}

          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
              Tabla final
            </h2>
            <StandingsTable rows={standings} />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link href={`/admin/torneos/${id}`} className="btn btn-secondary">
              Volver sin cerrar
            </Link>
            <form action={cerrarTorneoAction}>
              <input type="hidden" name="id" value={torneo.id} />
              <SubmitButton
                idleText="Confirmar cierre y campeón"
                loadingText="Cerrando..."
                confirmTitle={`Cerrar torneo con ${campeon.player_name} como campeón`}
                confirmText="Cerrar torneo"
                confirmMessage={`${campeon.player_name} queda registrado como campeón del torneo. Después del cierre no vas a poder modificar resultados ni parámetros, salvo que lo reabras.`}
              />
            </form>
          </div>
        </>
      )}
    </div>
  );
}
