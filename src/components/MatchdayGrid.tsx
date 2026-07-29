"use client";

import { useMemo, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { IconClose, IconPlus } from "@/components/icons";

export type GridPlayer = {
  id: string;
  display_name: string;
  active: boolean;
  matches_won: number;
  matches_lost: number;
  /** true si ya tenía un resultado guardado en esta fecha */
  cargado: boolean;
};

type Params = {
  points_per_win: number;
  points_per_loss: number;
  minimum_points_per_matchday: number;
};

type Fila = { id: string; g: string; p: string };

function calcularPuntos(g: number, p: number, params: Params) {
  if (g + p <= 0) return null;
  return Math.max(
    params.minimum_points_per_matchday,
    g * params.points_per_win + p * params.points_per_loss
  );
}

function formatear(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n);
}

/**
 * Carga de resultados de una fecha.
 *
 * Se van agregando los jugadores que participaron con el desplegable, se
 * completan sus partidos y al final se guarda TODA la fecha de una sola vez.
 * Los jugadores que se sacan de la lista quedan sin participación.
 */
export default function MatchdayGrid({
  action,
  matchdayId,
  players,
  params,
  soloLectura = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  matchdayId: string;
  players: GridPlayer[];
  params: Params;
  soloLectura?: boolean;
}) {
  // Nombres a mano para no buscar en el array todo el tiempo
  const porId = useMemo(() => new Map(players.map((j) => [j.id, j])), [players]);

  // Los que ya estaban guardados: hay que mandarlos siempre, aunque se quiten,
  // para que el servidor sepa que tiene que borrar su participación.
  const originales = useMemo(
    () => players.filter((j) => j.cargado).map((j) => j.id),
    [players]
  );

  const [filas, setFilas] = useState<Fila[]>(() =>
    players
      .filter((j) => j.cargado)
      .map((j) => ({
        id: j.id,
        g: String(j.matches_won),
        p: String(j.matches_lost),
      }))
  );

  const [aAgregar, setAAgregar] = useState("");

  const enLista = new Set(filas.map((f) => f.id));
  const disponibles = players.filter((j) => !enLista.has(j.id));

  function agregar() {
    if (!aAgregar) return;
    setFilas((f) => [...f, { id: aAgregar, g: "", p: "" }]);
    setAAgregar("");
  }

  function quitar(id: string) {
    setFilas((f) => f.filter((fila) => fila.id !== id));
  }

  function set(id: string, campo: "g" | "p", valor: string) {
    const limpio = valor.replace(/[^\d]/g, "").slice(0, 2);
    setFilas((f) => f.map((fila) => (fila.id === id ? { ...fila, [campo]: limpio } : fila)));
  }

  const resumen = useMemo(() => {
    let jugadores = 0;
    let partidos = 0;

    for (const f of filas) {
      const total = Number(f.g || 0) + Number(f.p || 0);
      if (total > 0) {
        jugadores += 1;
        partidos += total;
      }
    }

    return { jugadores, partidos };
  }, [filas]);

  // Todos los ids que el servidor tiene que evaluar
  const idsAEnviar = [...new Set([...filas.map((f) => f.id), ...originales])];

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="matchday_id" value={matchdayId} />
      <input type="hidden" name="player_ids" value={idsAEnviar.join(",")} />

      {!soloLectura && (
        <>
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:border-brand-700 dark:bg-gray-800 dark:text-brand-200">
            Agregá uno por uno a los que jugaron y cargá sus partidos. La fecha se guarda
            entera de una sola vez con el botón de abajo.
          </p>

          {/* Agregar jugador */}
          <div className="card p-3">
            <label htmlFor="agregar-jugador" className="form-label">
              Agregar jugador
            </label>

            <div className="flex gap-2">
              <select
                id="agregar-jugador"
                value={aAgregar}
                onChange={(e) => setAAgregar(e.target.value)}
                disabled={disponibles.length === 0}
                className="form-input min-w-0 flex-1"
              >
                <option value="">
                  {disponibles.length === 0
                    ? "Ya están todos cargados"
                    : "Elegí un jugador..."}
                </option>

                {disponibles.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.display_name}
                    {j.active ? "" : " (inactivo)"}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={agregar}
                disabled={!aAgregar}
                className="btn btn-secondary shrink-0"
              >
                <IconPlus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Jugadores de la fecha */}
      {filas.length === 0 ? (
        <p className="card px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {soloLectura
            ? "No hay resultados cargados en esta fecha."
            : "Todavía no agregaste a nadie. Empezá eligiendo un jugador arriba."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filas.map((fila) => {
            const jugador = porId.get(fila.id);
            if (!jugador) return null;

            const g = Number(fila.g || 0);
            const p = Number(fila.p || 0);
            const puntos = calcularPuntos(g, p, params);

            return (
              <li key={fila.id} className="card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate font-semibold text-gray-900 dark:text-gray-100">
                    {jugador.display_name}
                    {!jugador.active && (
                      <span className="ml-2 text-xs font-normal text-gray-400">inactivo</span>
                    )}
                  </p>

                  {!soloLectura && (
                    <button
                      type="button"
                      onClick={() => quitar(fila.id)}
                      aria-label={`Quitar a ${jugador.display_name} de la fecha`}
                      title="Quitar de la fecha"
                      className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400
                                 hover:bg-gray-100 hover:text-red-600
                                 dark:hover:bg-gray-700 dark:hover:text-red-400"
                    >
                      <IconClose className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-end gap-3">
                  <div className="w-20">
                    <label
                      htmlFor={`g_${fila.id}`}
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                    >
                      Ganados
                    </label>
                    <input
                      id={`g_${fila.id}`}
                      name={`g_${fila.id}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      disabled={soloLectura}
                      placeholder="0"
                      value={fila.g}
                      onChange={(e) => set(fila.id, "g", e.target.value)}
                      className="form-input px-2 text-center"
                    />
                  </div>

                  <div className="w-20">
                    <label
                      htmlFor={`p_${fila.id}`}
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                    >
                      Perdidos
                    </label>
                    <input
                      id={`p_${fila.id}`}
                      name={`p_${fila.id}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      disabled={soloLectura}
                      placeholder="0"
                      value={fila.p}
                      onChange={(e) => set(fila.id, "p", e.target.value)}
                      className="form-input px-2 text-center"
                    />
                  </div>

                  <div className="ml-auto pb-2 text-right">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Puntos
                    </span>
                    <span
                      className={[
                        "block text-lg font-bold tabular-nums leading-tight",
                        puntos !== null
                          ? "text-brand-500 dark:text-brand-300"
                          : "text-gray-300 dark:text-gray-600",
                      ].join(" ")}
                    >
                      {puntos !== null ? formatear(puntos) : "—"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Barra de guardado */}
      {!soloLectura && (
        <div
          className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3
                     backdrop-blur dark:border-gray-700 dark:bg-gray-900/95
                     sm:mx-0 sm:rounded-xl sm:border sm:px-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold">{resumen.jugadores}</span> jugador
              {resumen.jugadores === 1 ? "" : "es"} ·{" "}
              <span className="font-semibold">{resumen.partidos}</span> partido
              {resumen.partidos === 1 ? "" : "s"}
            </p>

            <SubmitButton idleText="Guardar la fecha" loadingText="Guardando..." />
          </div>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Se guardan todos los jugadores de la lista juntos. Quien quede en 0 y 0, o a quien
            saques de la lista, no queda registrado en la fecha.
          </p>
        </div>
      )}
    </form>
  );
}
