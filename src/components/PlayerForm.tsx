import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { ErrorBox } from "@/components/ui";
import type { Player } from "@/lib/types";

export default function PlayerForm({
  action,
  player,
  error,
  defaultName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  player?: Player;
  error?: string | null;
  /** Para reponer el nombre tipeado cuando el alta falla. */
  defaultName?: string;
}) {
  const esEdicion = !!player;

  return (
    <form action={action} className="card space-y-4 p-4 sm:p-6">
      {player && <input type="hidden" name="id" value={player.id} />}

      {error && <ErrorBox message={error} />}

      <div>
        <label htmlFor="display_name" className="form-label">
          Nombre o apodo <span className="text-red-500">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={60}
          autoComplete="off"
          className="form-input"
          placeholder="Ej: Juan, El Ruso, Pedrito"
          defaultValue={player?.display_name ?? defaultName ?? ""}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Es el nombre que se ve en la tabla. No puede repetirse.
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="form-label">
          Observaciones
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          className="form-input"
          placeholder="Opcional, solo lo ve el administrador"
          defaultValue={player?.notes ?? ""}
        />
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="active"
          defaultChecked={player ? player.active : true}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-brand-400
                     focus:ring-brand-400 dark:border-gray-600 dark:bg-gray-700"
        />
        <span>
          <span className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Jugador activo
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            Los inactivos no aparecen al cargar una fecha nueva, pero conservan su historial.
          </span>
        </span>
      </label>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Link href="/admin/jugadores" className="btn btn-secondary">
          Cancelar
        </Link>
        <SubmitButton
          idleText={esEdicion ? "Guardar cambios" : "Crear jugador"}
          loadingText="Guardando..."
        />
      </div>
    </form>
  );
}
