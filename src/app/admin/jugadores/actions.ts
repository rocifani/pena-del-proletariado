"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { toNullIfEmpty } from "@/lib/format";
import { mensajeDeError } from "@/lib/db-errors";

const LISTA = "/admin/jugadores";

function volver(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  redirect(`${path}?${qs}`);
}

export async function crearJugadorAction(formData: FormData) {
  const display_name = toNullIfEmpty(formData.get("display_name"));
  const notes = toNullIfEmpty(formData.get("notes"));
  const active = formData.get("active") === "on";

  if (!display_name) {
    volver("/admin/jugadores/nuevo", { error: "El nombre es obligatorio." });
    return;
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("players").insert({ display_name, notes, active });

  if (error) {
    volver("/admin/jugadores/nuevo", {
      error: mensajeDeError(error.code, error.message),
      nombre: display_name,
    });
    return;
  }

  revalidatePath(LISTA);
  volver(LISTA, { toast: `Jugador "${display_name}" creado.` });
}

export async function editarJugadorAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const display_name = toNullIfEmpty(formData.get("display_name"));
  const notes = toNullIfEmpty(formData.get("notes"));
  const active = formData.get("active") === "on";

  if (!id) {
    volver(LISTA, { error: "Falta el identificador del jugador." });
    return;
  }

  if (!display_name) {
    volver(`/admin/jugadores/${id}/editar`, { error: "El nombre es obligatorio." });
    return;
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("players")
    .update({ display_name, notes, active })
    .eq("id", id);

  if (error) {
    volver(`/admin/jugadores/${id}/editar`, {
      error: mensajeDeError(error.code, error.message),
    });
    return;
  }

  revalidatePath(LISTA);
  volver(LISTA, { toast: `Jugador "${display_name}" actualizado.` });
}

/** Activa o desactiva sin entrar a la pantalla de edición. */
export async function alternarActivoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const activar = formData.get("activar") === "1";
  const nombre = String(formData.get("nombre") ?? "El jugador");

  if (!id) {
    volver(LISTA, { error: "Falta el identificador del jugador." });
    return;
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("players").update({ active: activar }).eq("id", id);

  if (error) {
    volver(LISTA, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  revalidatePath(LISTA);
  volver(LISTA, {
    toast: `${nombre} quedó ${activar ? "activo" : "inactivo"}.`,
  });
}

/**
 * Solo se puede eliminar si el jugador no tiene resultados cargados.
 * Si los tiene, la clave foránea lo impide y mostramos el aviso.
 */
export async function eliminarJugadorAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "El jugador");

  if (!id) {
    volver(LISTA, { error: "Falta el identificador del jugador." });
    return;
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) {
    volver(LISTA, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  revalidatePath(LISTA);
  volver(LISTA, { toast: `${nombre} fue eliminado.` });
}
