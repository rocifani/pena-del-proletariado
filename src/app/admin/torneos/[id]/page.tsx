import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBox, PageHeader, Toast } from "@/components/ui";
import {
  MatchdayStatusBadge,
  TournamentStatusBadge,
} from "@/components/TournamentStatusBadge";
import StandingsTable from "@/components/StandingsTable";
import SubmitButton from "@/components/SubmitButton";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Matchday, Standing, Tournament } from "@/lib/types";
import { fecha, num } from "@/lib/format";
import {
  activarTorneoAction,
  cancelarTorneoAction,
  eliminarTorneoAction,
  reabrirTorneoAction,
} from "../actions";

export const dynamic = "force-dynamic";

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</dd>
    </div>
  );
}

export default async function TorneoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ toast?: string; error?: string }>;
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

  const [{ data: fechasData }, { data: standingsData }] = await Promise.all([
    supabase
      .from("matchdays")
      .select("*")
      .eq("tournament_id", id)
      .order("number", { ascending: false }),
    supabase
      .from("tournament_standings")
      .select("*")
      .eq("tournament_id", id)
      .order("position", { ascending: true }),
  ]);

  const fechas = (fechasData as Matchday[] | null) ?? [];
  const standings = (standingsData as Standing[] | null) ?? [];

  let campeon: string | null = null;
  if (torneo.winner_player_id) {
    const { data } = await supabase
      .from("players")
      .select("display_name")
      .eq("id", torneo.winner_player_id)
      .maybeSingle();

    campeon = (data as { display_name: string } | null)?.display_name ?? null;
  }

  const esBorrador = torneo.status === "draft";
  const esActivo = torneo.status === "active";
  const esFinalizado = torneo.status === "finished";
  const puedeEditar = esBorrador || esActivo;
  const completadas = fechas.filter((j) => j.status === "completed").length;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/torneos"
          className="text-sm font-medium text-brand-500 hover:underline dark:text-brand-300"
        >
          ← Torneos
        </Link>
      </div>

      <PageHeader
        title={torneo.name}
        subtitle={torneo.description ?? undefined}
        action={<TournamentStatusBadge status={torneo.status} />}
      />

      <Toast message={sp.toast ?? null} />
      {sp.error && (
        <div className="mb-4">
          <ErrorBox message={sp.error} />
        </div>
      )}

      {esFinalizado && campeon && (
        <div className="mb-4 rounded-xl bg-brand-400 px-4 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Campeón</p>
          <p className="mt-0.5 text-xl font-bold">🏆 {campeon}</p>
          {torneo.closed_at && (
            <p className="mt-1 text-sm text-white/80">
              Cerrado el {fecha(torneo.closed_at.slice(0, 10))}
            </p>
          )}
        </div>
      )}

      {/* Parámetros */}
      <section className="card mb-4 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Configuración</h2>
          {puedeEditar && (
            <Link
              href={`/admin/torneos/${torneo.id}/editar`}
              className="text-sm font-semibold text-brand-500 hover:underline dark:text-brand-300"
            >
              Editar
            </Link>
          )}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Dato label="Por ganado" value={num(torneo.points_per_win)} />
          <Dato label="Por perdido" value={num(torneo.points_per_loss)} />
          <Dato label="Mínimo" value={num(torneo.minimum_points_per_matchday)} />
          <Dato label="Inicio" value={fecha(torneo.start_date)} />
          <Dato label="Fin" value={fecha(torneo.end_date)} />
          <Dato label="Fechas" value={`${completadas} de ${fechas.length}`} />
        </dl>
      </section>

      {/* Acciones de estado */}
      <section className="card mb-6 px-4 py-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100">Estado del torneo</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {esBorrador && (
            <form action={activarTorneoAction}>
              <input type="hidden" name="id" value={torneo.id} />
              <SubmitButton
                idleText="Activar torneo"
                loadingText="Activando..."
                confirmTitle="Activar torneo"
                confirmText="Activar"
                confirmMessage="Pasa a ser el torneo en curso y se muestra en el sitio público. A partir de ahí vas a poder cargarle fechas."
              />
            </form>
          )}

          {esActivo && (
            <Link href={`/admin/torneos/${torneo.id}/cerrar`} className="btn btn-primary">
              Cerrar torneo
            </Link>
          )}

          {esActivo && (
            <Link href="/admin/fechas" className="btn btn-secondary">
              Cargar fechas
            </Link>
          )}

          {esFinalizado && (
            <form action={reabrirTorneoAction}>
              <input type="hidden" name="id" value={torneo.id} />
              <SubmitButton
                idleText="Reabrir torneo"
                loadingText="Reabriendo..."
                className="btn btn-secondary"
                confirmTitle="Reabrir torneo"
                confirmText="Reabrir"
                confirmMessage="Vuelve a estar en curso y el campeón deja de ser definitivo hasta que lo cierres de nuevo. Si ya hay otro torneo activo, la operación se va a rechazar."
              />
            </form>
          )}

          {puedeEditar && (
            <form action={cancelarTorneoAction}>
              <input type="hidden" name="id" value={torneo.id} />
              <SubmitButton
                idleText="Cancelar torneo"
                loadingText="Cancelando..."
                className="btn btn-danger"
                confirmTitle="Cancelar torneo"
                confirmText="Cancelar torneo"
                confirmMessage="Deja de aparecer como torneo en curso. Los datos y las fechas se conservan, pero no vas a poder seguir cargando resultados."
              />
            </form>
          )}

          {esBorrador && fechas.length === 0 && (
            <form action={eliminarTorneoAction}>
              <input type="hidden" name="id" value={torneo.id} />
              <SubmitButton
                idleText="Eliminar"
                loadingText="Eliminando..."
                className="btn btn-danger"
                confirmTitle="Eliminar torneo"
                confirmText="Eliminar"
                confirmMessage="Se borra el torneo definitivamente. Como todavía está en borrador y no tiene fechas, no se pierde ningún resultado."
              />
            </form>
          )}
        </div>

        {esBorrador && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Mientras esté en borrador no aparece en el sitio público y no se le pueden cargar
            fechas.
          </p>
        )}
      </section>

      {/* Fechas */}
      <section className="mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Fechas</h2>
          {esActivo && (
            <Link
              href="/admin/fechas"
              className="text-sm font-semibold text-brand-500 hover:underline dark:text-brand-300"
            >
              Administrar
            </Link>
          )}
        </div>

        {fechas.length === 0 ? (
          <p className="card px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Todavía no hay fechas en este torneo.
          </p>
        ) : (
          <ul className="space-y-2">
            {fechas.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/admin/fechas/${j.id}`}
                  className="card flex items-center justify-between gap-3 px-4 py-3 hover:border-brand-300"
                >
                  <span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      Fecha {j.number}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {fecha(j.played_at)}
                    </span>
                  </span>
                  <MatchdayStatusBadge status={j.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tabla general */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">Tabla general</h2>
        <StandingsTable rows={standings} />
      </section>
    </div>
  );
}
