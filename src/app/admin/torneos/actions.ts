"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { toNullIfEmpty } from "@/lib/format";
import { mensajeDeError } from "@/lib/db-errors";
import type { Standing } from "@/lib/types";

const LISTA = "/admin/torneos";

function volver(path: string, params: Record<string, string>) {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

function refrescar(id?: string) {
  revalidatePath(LISTA);
  revalidatePath("/admin");
  revalidatePath("/admin/fechas");
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/admin/torneos/${id}`);
}

/** Lee un campo numérico obligatorio del formulario. */
function numero(formData: FormData, campo: string): number | null {
  const raw = String(formData.get(campo) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type Parametros = {
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  points_per_win: number;
  points_per_loss: number;
  minimum_points_per_matchday: number;
};

/** Valida y arma el objeto a guardar. Devuelve un string si algo está mal. */
function leerParametros(formData: FormData): Parametros | string {
  const name = toNullIfEmpty(formData.get("name"));
  if (!name) return "El nombre del torneo es obligatorio.";

  const points_per_win = numero(formData, "points_per_win");
  const points_per_loss = numero(formData, "points_per_loss");
  const minimum_points_per_matchday = numero(formData, "minimum_points_per_matchday");

  if (points_per_win === null) return "Los puntos por partido ganado tienen que ser un número.";
  if (points_per_loss === null) return "Los puntos por partido perdido tienen que ser un número.";
  if (minimum_points_per_matchday === null) return "El mínimo por fecha tiene que ser un número.";
  if (minimum_points_per_matchday < 0) return "El mínimo por fecha no puede ser negativo.";

  const start_date = toNullIfEmpty(formData.get("start_date"));
  const end_date = toNullIfEmpty(formData.get("end_date"));

  if (start_date && end_date && end_date < start_date) {
    return "La fecha de finalización no puede ser anterior a la de inicio.";
  }

  return {
    name,
    description: toNullIfEmpty(formData.get("description")),
    start_date,
    end_date,
    points_per_win,
    points_per_loss,
    minimum_points_per_matchday,
  };
}

export async function crearTorneoAction(formData: FormData) {
  const parametros = leerParametros(formData);
  if (typeof parametros === "string") {
    volver("/admin/torneos/nuevo", { error: parametros });
    return;
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("tournaments")
    .insert(parametros)
    .select("id")
    .single();

  if (error) {
    volver("/admin/torneos/nuevo", { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(data.id);
  volver(`/admin/torneos/${data.id}`, {
    toast: "Torneo creado en borrador. Revisá el puntaje y activalo cuando esté listo.",
  });
}

export async function editarTorneoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    volver(LISTA, { error: "Falta el identificador del torneo." });
    return;
  }

  const parametros = leerParametros(formData);
  if (typeof parametros === "string") {
    volver(`/admin/torneos/${id}/editar`, { error: parametros });
    return;
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("tournaments").update(parametros).eq("id", id);

  if (error) {
    volver(`/admin/torneos/${id}/editar`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(id);
  volver(`/admin/torneos/${id}`, {
    toast: "Torneo actualizado. El ranking ya está recalculado con el puntaje nuevo.",
  });
}

/** draft → active */
export async function activarTorneoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    volver(`/admin/torneos/${id}`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(id);
  volver(`/admin/torneos/${id}`, { toast: "Torneo activado. Ya podés cargar fechas." });
}

/**
 * active → finished.
 * El campeón sale de la tabla general (posición 1) en el momento del cierre.
 */
export async function cerrarTorneoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServer();

  const { data: standings } = await supabase
    .from("tournament_standings")
    .select("player_id, player_name, position")
    .eq("tournament_id", id)
    .order("position", { ascending: true })
    .limit(1);

  const campeon = (standings as Pick<Standing, "player_id" | "player_name">[] | null)?.[0];

  if (!campeon) {
    volver(`/admin/torneos/${id}/cerrar`, {
      error: "No se puede cerrar: el torneo todavía no tiene fechas completadas.",
    });
    return;
  }

  const hoy = new Date().toISOString().slice(0, 10);

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("end_date")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("tournaments")
    .update({
      status: "finished",
      winner_player_id: campeon.player_id,
      end_date: torneo?.end_date ?? hoy,
    })
    .eq("id", id);

  if (error) {
    volver(`/admin/torneos/${id}/cerrar`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(id);
  volver(`/admin/torneos/${id}`, {
    toast: `Torneo cerrado. Campeón: ${campeon.player_name}.`,
  });
}

/** finished → active. La base limpia campeón y fecha de cierre. */
export async function reabrirTorneoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    volver(`/admin/torneos/${id}`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(id);
  volver(`/admin/torneos/${id}`, {
    toast: "Torneo reabierto. El campeón se vuelve a confirmar cuando lo cierres de nuevo.",
  });
}

export async function cancelarTorneoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tournaments")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    volver(`/admin/torneos/${id}`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(id);
  volver(`/admin/torneos/${id}`, { toast: "Torneo cancelado." });
}

/** Solo para borradores: borra el torneo y sus fechas. */
export async function eliminarTorneoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("tournaments").delete().eq("id", id);

  if (error) {
    volver(`/admin/torneos/${id}`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar();
  volver(LISTA, { toast: "Torneo eliminado." });
}
