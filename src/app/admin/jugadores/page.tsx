import Link from "next/link";
import { Badge, EmptyState, ErrorBox, PageHeader, Toast } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Player } from "@/lib/types";
import { alternarActivoAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jugadores" };

type SP = { toast?: string; error?: string; q?: string };

export default async function AdminJugadoresPage({
  searchParams,
}: {
  searchParams?: Promise<SP>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const supabase = await createSupabaseServerReadOnly();

  let query = supabase
    .from("players")
    .select("id, display_name, active, notes, created_at, updated_at")
    .order("active", { ascending: false })
    .order("display_name", { ascending: true });

  if (q) query = query.ilike("display_name", `%${q}%`);

  const { data, error } = await query;
  const players = (data as Player[] | null) ?? [];

  return (
    <div>
      <PageHeader
        title="Jugadores"
        subtitle="Se mantienen entre torneos. Desactivá en vez de eliminar."
        action={
          <Link href="/admin/jugadores/nuevo" className="btn btn-primary">
            <IconPlus />
            Nuevo
          </Link>
        }
      />

      <Toast message={sp.toast ?? null} />
      {sp.error && (
        <div className="mb-4">
          <ErrorBox message={sp.error} />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorBox message={error.message} />
        </div>
      )}

      {/* Buscador */}
      <form className="mb-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar jugador..."
          className="form-input"
          aria-label="Buscar jugador"
        />
        <button type="submit" className="btn btn-secondary shrink-0">
          Buscar
        </button>
      </form>

      {players.length === 0 ? (
        <EmptyState
          title={q ? "Ningún jugador coincide con la búsqueda" : "Todavía no hay jugadores"}
          description={
            q
              ? "Probá con otro texto."
              : "Cargá a los integrantes de la peña para poder armar las fechas."
          }
          action={
            !q ? (
              <Link href="/admin/jugadores/nuevo" className="btn btn-primary">
                Crear el primero
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.id} className="card px-3 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    p.active
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-100"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {p.display_name.trim().charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                    {p.display_name}
                  </p>
                  {p.notes && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.notes}</p>
                  )}
                </div>

                {!p.active && <Badge tone="neutral">Inactivo</Badge>}
              </div>

              <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                <form action={alternarActivoAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="nombre" value={p.display_name} />
                  <input type="hidden" name="activar" value={p.active ? "0" : "1"} />
                  <SubmitButton
                    idleText={p.active ? "Desactivar" : "Activar"}
                    loadingText="..."
                    className="btn btn-secondary"
                  />
                </form>

                <Link href={`/admin/jugadores/${p.id}/editar`} className="btn btn-secondary">
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {players.length > 0 && (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Total: {players.length} jugador{players.length === 1 ? "" : "es"}
        </p>
      )}
    </div>
  );
}
