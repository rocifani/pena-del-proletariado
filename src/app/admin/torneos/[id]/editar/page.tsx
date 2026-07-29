import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import TournamentForm from "@/components/TournamentForm";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import type { Tournament } from "@/lib/types";
import { editarTorneoAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar torneo" };

export default async function EditarTorneoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  const supabase = await createSupabaseServerReadOnly();

  const { data } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const torneo = data as Tournament;

  // Un torneo cerrado o cancelado no se edita: primero hay que reabrirlo.
  if (torneo.status !== "draft" && torneo.status !== "active") {
    redirect(
      `/admin/torneos/${id}?error=${encodeURIComponent(
        "Este torneo no se puede editar en su estado actual. Reabrilo primero."
      )}`
    );
  }

  const { count } = await supabase
    .from("matchdays")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", id)
    .eq("status", "completed");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link
          href={`/admin/torneos/${id}`}
          className="text-sm font-medium text-brand-500 hover:underline dark:text-brand-300"
        >
          ← {torneo.name}
        </Link>
      </div>

      <PageHeader title="Editar torneo" />

      <TournamentForm
        action={editarTorneoAction}
        tournament={torneo}
        error={sp.error ?? null}
        avisarRecalculo={(count ?? 0) > 0}
      />
    </div>
  );
}
