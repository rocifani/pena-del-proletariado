import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBox, PageHeader, Toast } from "@/components/ui";
import { MatchdayStatusBadge } from "@/components/TournamentStatusBadge";
import MatchdayGrid, { type GridPlayer } from "@/components/MatchdayGrid";
import SubmitButton from "@/components/SubmitButton";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Matchday, MatchdayResult, Player, Tournament } from "@/lib/types";
import { fecha } from "@/lib/format";
import {
  cambiarEstadoJornadaAction,
  editarJornadaAction,
  eliminarJornadaAction,
  guardarResultadosAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function JornadaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ toast?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  const supabase = await createSupabaseServerReadOnly();

  const { data: matchdayData } = await supabase
    .from("matchdays")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!matchdayData) notFound();
  const matchday = matchdayData as Matchday;

  const [{ data: torneoData }, { data: playersData }, { data: resultadosData }] =
    await Promise.all([
      supabase.from("tournaments").select("*").eq("id", matchday.tournament_id).maybeSingle(),
      supabase
        .from("players")
        .select("id, display_name, active, notes, created_at, updated_at")
        .order("active", { ascending: false })
        .order("display_name", { ascending: true }),
      supabase.from("matchday_results").select("*").eq("matchday_id", id),
    ]);

  const torneo = torneoData as Tournament | null;
  const players = (playersData as Player[] | null) ?? [];
  const resultados = (resultadosData as MatchdayResult[] | null) ?? [];

  const porJugador = new Map(resultados.map((r) => [r.player_id, r]));

  const grid: GridPlayer[] = players.map((p) => {
    const r = porJugador.get(p.id);
    return {
      id: p.id,
      display_name: p.display_name,
      active: p.active,
      matches_won: r?.matches_won ?? 0,
      matches_lost: r?.matches_lost ?? 0,
      cargado: !!r,
    };
  });

  // Solo se puede tocar si el torneo está en curso o en borrador
  const torneoAbierto = torneo?.status === "active" || torneo?.status === "draft";
  const soloLectura = !torneoAbierto || matchday.status === "cancelled";

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/fechas"
          className="text-sm font-medium text-brand-500 hover:underline dark:text-brand-300"
        >
          ← Fechas
        </Link>
      </div>

      <PageHeader
        title={`Fecha ${matchday.number}`}
        subtitle={`${torneo?.name ?? ""} · ${fecha(matchday.played_at)}`}
        action={<MatchdayStatusBadge status={matchday.status} />}
      />

      <Toast message={sp.toast ?? null} />
      {sp.error && (
        <div className="mb-4">
          <ErrorBox message={sp.error} />
        </div>
      )}

      {!torneoAbierto && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          El torneo está cerrado o cancelado, así que esta fecha es de solo lectura. Reabrí el
          torneo si necesitás corregir algo.
        </p>
      )}

      {/* Carga de resultados */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">Resultados</h2>

        {torneo ? (
          <MatchdayGrid
            action={guardarResultadosAction}
            matchdayId={matchday.id}
            players={grid}
            soloLectura={soloLectura}
            params={{
              points_per_win: torneo.points_per_win,
              points_per_loss: torneo.points_per_loss,
              minimum_points_per_matchday: torneo.minimum_points_per_matchday,
            }}
          />
        ) : (
          <ErrorBox message="No se encontró el torneo de esta fecha." />
        )}
      </section>

      {/* Estado */}
      {torneoAbierto && (
        <section className="card mb-6 px-4 py-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Estado de la fecha</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Solo las fechas completadas suman a la tabla general y a la asistencia.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {matchday.status !== "completed" && (
              <form action={cambiarEstadoJornadaAction}>
                <input type="hidden" name="id" value={matchday.id} />
                <input type="hidden" name="status" value="completed" />
                <SubmitButton idleText="Marcar como completada" loadingText="Guardando..." />
              </form>
            )}

            {matchday.status === "completed" && (
              <form action={cambiarEstadoJornadaAction}>
                <input type="hidden" name="id" value={matchday.id} />
                <input type="hidden" name="status" value="draft" />
                <SubmitButton
                  idleText="Volver a borrador"
                  loadingText="Guardando..."
                  className="btn btn-secondary"
                  confirmTitle="Volver la fecha a borrador"
                  confirmText="Volver a borrador"
                  confirmMessage="Deja de contar para la tabla general y para la asistencia hasta que la vuelvas a marcar como completada."
                />
              </form>
            )}

            {matchday.status !== "cancelled" && (
              <form action={cambiarEstadoJornadaAction}>
                <input type="hidden" name="id" value={matchday.id} />
                <input type="hidden" name="status" value="cancelled" />
                <SubmitButton
                  idleText="Cancelar fecha"
                  loadingText="Cancelando..."
                  className="btn btn-danger"
                  confirmTitle="Cancelar fecha"
                  confirmText="Cancelar fecha"
                  confirmMessage="No cuenta para la tabla ni para la asistencia. Los resultados cargados se conservan por si después la querés reactivar."
                />
              </form>
            )}

            {matchday.status === "cancelled" && (
              <form action={cambiarEstadoJornadaAction}>
                <input type="hidden" name="id" value={matchday.id} />
                <input type="hidden" name="status" value="draft" />
                <SubmitButton
                  idleText="Reactivar fecha"
                  loadingText="Guardando..."
                  className="btn btn-secondary"
                />
              </form>
            )}
          </div>
        </section>
      )}

      {/* Datos de la fecha */}
      {torneoAbierto && (
        <section className="card mb-6 p-4">
          <h2 className="mb-3 font-bold text-gray-900 dark:text-gray-100">Datos de la fecha</h2>

          <form action={editarJornadaAction} className="space-y-3">
            <input type="hidden" name="id" value={matchday.id} />

            <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
              <div>
                <label htmlFor="number" className="form-label">
                  Número
                </label>
                <input
                  id="number"
                  name="number"
                  type="number"
                  min="1"
                  step="1"
                  required
                  inputMode="numeric"
                  className="form-input"
                  defaultValue={matchday.number}
                />
              </div>

              <div>
                <label htmlFor="played_at" className="form-label">
                  Día
                </label>
                <input
                  id="played_at"
                  name="played_at"
                  type="date"
                  className="form-input"
                  defaultValue={matchday.played_at ?? ""}
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="form-label">
                Observaciones
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                maxLength={500}
                className="form-input"
                defaultValue={matchday.notes ?? ""}
              />
            </div>

            <div className="flex justify-end">
              <SubmitButton
                idleText="Guardar datos"
                loadingText="Guardando..."
                className="btn btn-secondary"
              />
            </div>
          </form>
        </section>
      )}

      {/* Eliminar */}
      {torneoAbierto && (
        <section className="rounded-xl border border-red-200 px-4 py-4 dark:border-red-900">
          <h2 className="font-semibold text-red-700 dark:text-red-300">Eliminar fecha</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Se borra la fecha junto con todos sus resultados. Si solo querés que deje de contar,
            cancelala en lugar de eliminarla.
          </p>

          <form action={eliminarJornadaAction} className="mt-3">
            <input type="hidden" name="id" value={matchday.id} />
            <SubmitButton
              idleText="Eliminar fecha"
              loadingText="Eliminando..."
              className="btn btn-danger"
              confirmTitle={`Eliminar la fecha ${matchday.number}`}
              confirmText="Eliminar"
              confirmMessage="Se borran la fecha y todos sus resultados. Esta acción no se puede deshacer. Si solo querés que deje de contar, cancelala en lugar de eliminarla."
            />
          </form>
        </section>
      )}
    </div>
  );
}
