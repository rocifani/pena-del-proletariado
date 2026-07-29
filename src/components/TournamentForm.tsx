import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { ErrorBox } from "@/components/ui";
import type { Tournament } from "@/lib/types";

/**
 * Formulario de alta y edición de torneo.
 * Los parámetros de puntaje se pueden tocar mientras el torneo esté en
 * borrador o activo; al guardarlos se recalcula todo el ranking.
 */
export default function TournamentForm({
  action,
  tournament,
  error,
  defaults,
  avisarRecalculo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  tournament?: Tournament;
  error?: string | null;
  /** Valores sugeridos al crear (por ejemplo, copiados del torneo anterior). */
  defaults?: Partial<Tournament>;
  /** Si el torneo ya tiene fechas cargadas, avisamos antes de guardar. */
  avisarRecalculo?: boolean;
}) {
  const esEdicion = !!tournament;
  const v = tournament ?? defaults ?? {};

  return (
    <form action={action} className="card space-y-5 p-4 sm:p-6">
      {tournament && <input type="hidden" name="id" value={tournament.id} />}

      {error && <ErrorBox message={error} />}

      <div>
        <label htmlFor="name" className="form-label">
          Nombre del torneo <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          className="form-input"
          placeholder="Ej: Apertura 2026"
          defaultValue={v.name ?? ""}
        />
      </div>

      <div>
        <label htmlFor="description" className="form-label">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          className="form-input"
          placeholder="Opcional"
          defaultValue={v.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_date" className="form-label">
            Fecha de inicio
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="form-input"
            defaultValue={v.start_date ?? ""}
          />
        </div>

        <div>
          <label htmlFor="end_date" className="form-label">
            Fecha de finalización
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            className="form-input"
            defaultValue={v.end_date ?? ""}
          />
        </div>
      </div>

      {/* Parámetros de puntaje */}
      <fieldset className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <legend className="px-1 text-sm font-bold text-gray-700 dark:text-gray-200">
          Puntaje por fecha
        </legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="points_per_win" className="form-label">
              Por partido ganado
            </label>
            <input
              id="points_per_win"
              name="points_per_win"
              type="number"
              step="0.25"
              required
              inputMode="decimal"
              className="form-input"
              defaultValue={v.points_per_win ?? 1}
            />
          </div>

          <div>
            <label htmlFor="points_per_loss" className="form-label">
              Por partido perdido
            </label>
            <input
              id="points_per_loss"
              name="points_per_loss"
              type="number"
              step="0.25"
              required
              inputMode="decimal"
              className="form-input"
              defaultValue={v.points_per_loss ?? -0.5}
            />
          </div>

          <div>
            <label htmlFor="minimum_points_per_matchday" className="form-label">
              Mínimo por fecha
            </label>
            <input
              id="minimum_points_per_matchday"
              name="minimum_points_per_matchday"
              type="number"
              step="0.25"
              min="0"
              required
              inputMode="decimal"
              className="form-input"
              defaultValue={v.minimum_points_per_matchday ?? 0.5}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Los puntos de cada fecha se calculan así:{" "}
          <span className="font-mono">
            máximo(mínimo, ganados × puntos_ganado + perdidos × puntos_perdido)
          </span>
          . Por ejemplo, con 1 / −0,5 / 0,5: quien gana 4 y pierde 2 suma 3 puntos; quien pierde
          todo se lleva el mínimo de 0,5.
        </p>
      </fieldset>

      {avisarRecalculo && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Este torneo ya tiene fechas cargadas. Si cambiás el puntaje, se recalculan todas las
          fechas y pueden cambiar las posiciones. Los partidos ganados y perdidos no se tocan.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Link
          href={tournament ? `/admin/torneos/${tournament.id}` : "/admin/torneos"}
          className="btn btn-secondary"
        >
          Cancelar
        </Link>
        <SubmitButton
          idleText={esEdicion ? "Guardar cambios" : "Crear torneo"}
          loadingText="Guardando..."
          confirmTitle="Recalcular el torneo"
          confirmText="Guardar y recalcular"
          confirmMessage={
            avisarRecalculo
              ? "Se recalculan los puntos de todas las fechas y pueden cambiar las posiciones de la tabla. Los partidos ganados y perdidos no se modifican."
              : undefined
          }
        />
      </div>
    </form>
  );
}
