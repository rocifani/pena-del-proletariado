import Link from "next/link";
import { EmptyState, ErrorBox, PageHeader, Toast } from "@/components/ui";
import { MatchdayStatusBadge } from "@/components/TournamentStatusBadge";
import SubmitButton from "@/components/SubmitButton";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Matchday, Tournament } from "@/lib/types";
import { fecha, hoyISO } from "@/lib/format";
import { crearJornadaAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fechas" };

export default async function AdminJornadasPage({
  searchParams,
}: {
  searchParams?: Promise<{ toast?: string; error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const supabase = await createSupabaseServerReadOnly();

  const { data: torneoData } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  if (!torneoData) {
    return (
      <div>
        <PageHeader title="Fechas" />
        <Toast message={sp.toast ?? null} />
        <EmptyState
          title="No hay ningún torneo en curso"
          description="Las fechas se cargan sobre el torneo activo. Activá uno para empezar."
          action={
            <Link href="/admin/torneos" className="btn btn-primary">
              Ir a torneos
            </Link>
          }
        />
      </div>
    );
  }

  const torneo = torneoData as Tournament;

  const { data: fechasData } = await supabase
    .from("matchdays")
    .select("*")
    .eq("tournament_id", torneo.id)
    .order("number", { ascending: false });

  const fechas = (fechasData as Matchday[] | null) ?? [];

  // Cantidad de jugadores cargados por fecha
  const conteos = new Map<string, number>();
  if (fechas.length > 0) {
    const { data: resultados } = await supabase
      .from("matchday_results")
      .select("matchday_id")
      .in(
        "matchday_id",
        fechas.map((j) => j.id)
      );

    for (const r of (resultados as { matchday_id: string }[] | null) ?? []) {
      conteos.set(r.matchday_id, (conteos.get(r.matchday_id) ?? 0) + 1);
    }
  }

  const siguienteNumero = fechas.reduce((max, j) => Math.max(max, j.number), 0) + 1;

  return (
    <div>
      <PageHeader title="Fechas" subtitle={torneo.name} />

      <Toast message={sp.toast ?? null} />
      {sp.error && (
        <div className="mb-4">
          <ErrorBox message={sp.error} />
        </div>
      )}

      {/* Alta rápida */}
      <form action={crearJornadaAction} className="card mb-6 p-4">
        <input type="hidden" name="tournament_id" value={torneo.id} />

        <h2 className="mb-3 font-bold text-gray-900 dark:text-gray-100">Nueva fecha</h2>

        <div className="grid gap-3 sm:grid-cols-[6rem_1fr_auto] sm:items-end">
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
              defaultValue={siguienteNumero}
            />
          </div>

          <div>
            <label htmlFor="played_at" className="form-label">
              Día de la juntada
            </label>
            <input
              id="played_at"
              name="played_at"
              type="date"
              className="form-input"
              defaultValue={hoyISO()}
            />
          </div>

          <SubmitButton idleText="Crear fecha" loadingText="Creando..." />
        </div>
      </form>

      {/* Listado */}
      {fechas.length === 0 ? (
        <EmptyState
          title="Todavía no hay fechas"
          description="Creá la primera con el formulario de arriba y cargá los resultados de la juntada."
        />
      ) : (
        <ul className="space-y-2">
          {fechas.map((j) => {
            const cargados = conteos.get(j.id) ?? 0;

            return (
              <li key={j.id}>
                <Link
                  href={`/admin/fechas/${j.id}`}
                  className="card flex items-center justify-between gap-3 px-4 py-3 hover:border-brand-300"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Fecha {j.number}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {fecha(j.played_at)} · {cargados} jugador{cargados === 1 ? "" : "es"}
                    </p>
                  </div>

                  <MatchdayStatusBadge status={j.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
