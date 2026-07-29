import type { Standing } from "@/lib/types";
import { num, pct } from "@/lib/format";

function PositionBadge({ position }: { position: number }) {
  const tone =
    position === 1
      ? "bg-brand-400 text-white"
      : position <= 3
        ? "bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-100"
        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tone}`}
    >
      {position}
    </span>
  );
}

/**
 * Tabla general del torneo.
 * En mobile se muestra como lista de tarjetas; desde sm, como tabla.
 */
export default function StandingsTable({ rows }: { rows: Standing[] }) {
  if (rows.length === 0) {
    return (
      <div className="card px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Todavía no hay fechas completadas en este torneo.
      </div>
    );
  }

  return (
    <>
      {/* Mobile */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((r) => (
          <li key={r.player_id} className="card p-3">
            <div className="flex items-center gap-3">
              <PositionBadge position={r.position} />
              <span className="min-w-0 flex-1 truncate font-semibold text-gray-900 dark:text-gray-100">
                {r.player_name}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-base font-bold text-brand-500 dark:text-brand-300">
                  {num(r.total_points)}
                </span>
                <span className="block text-[11px] uppercase tracking-wide text-gray-400">
                  puntos
                </span>
              </span>
            </div>

            <dl className="mt-2 grid grid-cols-4 gap-2 border-t border-gray-100 pt-2 text-center dark:border-gray-700">
              <div>
                <dt className="text-[11px] uppercase text-gray-400">Fechas</dt>
                <dd className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {r.matchdays_played}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase text-gray-400">G-P</dt>
                <dd className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {r.matches_won}-{r.matches_lost}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase text-gray-400">Prom.</dt>
                <dd className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {num(r.average_points)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase text-gray-400">% Vic.</dt>
                <dd className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {pct(r.win_percentage)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 sm:block">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Jugador</th>
                <th className="px-3 py-3 text-right">Fechas</th>
                <th className="px-3 py-3 text-right">Gan.</th>
                <th className="px-3 py-3 text-right">Perd.</th>
                <th className="px-3 py-3 text-right">Part.</th>
                <th className="px-3 py-3 text-right">Puntos</th>
                <th className="px-3 py-3 text-right">Prom.</th>
                <th className="px-3 py-3 text-right">% Vic.</th>
                <th className="px-3 py-3 text-right">% Asist.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {rows.map((r) => (
                <tr key={r.player_id} className="text-gray-700 dark:text-gray-300">
                  <td className="px-3 py-2.5">
                    <PositionBadge position={r.position} />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                    {r.player_name}
                  </td>
                  <td className="px-3 py-2.5 text-right">{r.matchdays_played}</td>
                  <td className="px-3 py-2.5 text-right">{r.matches_won}</td>
                  <td className="px-3 py-2.5 text-right">{r.matches_lost}</td>
                  <td className="px-3 py-2.5 text-right">{r.total_matches}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-brand-500 dark:text-brand-300">
                    {num(r.total_points)}
                  </td>
                  <td className="px-3 py-2.5 text-right">{num(r.average_points)}</td>
                  <td className="px-3 py-2.5 text-right">{pct(r.win_percentage)}</td>
                  <td className="px-3 py-2.5 text-right">{pct(r.attendance_percentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
