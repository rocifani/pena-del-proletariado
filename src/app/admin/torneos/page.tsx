import Link from "next/link";
import { EmptyState, ErrorBox, PageHeader, Toast } from "@/components/ui";
import { TournamentStatusBadge } from "@/components/TournamentStatusBadge";
import { IconPlus } from "@/components/icons";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Tournament } from "@/lib/types";
import { fecha, num } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Torneos" };

const ORDEN: Record<string, number> = { active: 0, draft: 1, finished: 2, cancelled: 3 };

export default async function AdminTorneosPage({
  searchParams,
}: {
  searchParams?: Promise<{ toast?: string; error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const supabase = await createSupabaseServerReadOnly();

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });

  const torneos = ((data as Tournament[] | null) ?? []).sort(
    (a, b) => (ORDEN[a.status] ?? 9) - (ORDEN[b.status] ?? 9)
  );

  return (
    <div>
      <PageHeader
        title="Torneos"
        subtitle="Solo puede haber un torneo en curso a la vez."
        action={
          <Link href="/admin/torneos/nuevo" className="btn btn-primary">
            <IconPlus />
            Nuevo
          </Link>
        }
      />

      <Toast message={sp.toast ?? null} />
      {(sp.error || error) && (
        <div className="mb-4">
          <ErrorBox message={sp.error ?? error!.message} />
        </div>
      )}

      {torneos.length === 0 ? (
        <EmptyState
          title="Todavía no hay torneos"
          description="Creá el primero, configurá el puntaje y activalo para empezar a cargar fechas."
          action={
            <Link href="/admin/torneos/nuevo" className="btn btn-primary">
              Crear torneo
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {torneos.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/torneos/${t.id}`}
                className="card block px-4 py-3 transition-colors hover:border-brand-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</span>
                  <TournamentStatusBadge status={t.status} />
                </div>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t.start_date ? fecha(t.start_date) : "Sin fecha de inicio"}
                  {t.end_date ? ` — ${fecha(t.end_date)}` : ""}
                </p>

                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Puntaje: {num(t.points_per_win)} por ganado · {num(t.points_per_loss)} por
                  perdido · mínimo {num(t.minimum_points_per_matchday)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
