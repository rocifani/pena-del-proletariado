"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { toNullIfEmpty } from "@/lib/format";
import { mensajeDeError } from "@/lib/db-errors";
import type { MatchdayStatus } from "@/lib/types";

const LISTA = "/admin/fechas";

function volver(path: string, params: Record<string, string>) {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

function refrescar(matchdayId?: string) {
  revalidatePath(LISTA);
  revalidatePath("/admin");
  revalidatePath("/admin/torneos", "layout");
  revalidatePath("/", "layout");
  if (matchdayId) revalidatePath(`${LISTA}/${matchdayId}`);
}

/** Crea una fecha nueva en el torneo indicado. */
export async function crearJornadaAction(formData: FormData) {
  const tournament_id = String(formData.get("tournament_id") ?? "");
  if (!tournament_id) {
    volver(LISTA, { error: "No hay un torneo activo." });
    return;
  }

  const numeroRaw = String(formData.get("number") ?? "").trim();
  const number = Number(numeroRaw);

  if (!numeroRaw || !Number.isInteger(number) || number <= 0) {
    volver(LISTA, { error: "El número de fecha tiene que ser un entero mayor que cero." });
    return;
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("matchdays")
    .insert({
      tournament_id,
      number,
      played_at: toNullIfEmpty(formData.get("played_at")),
      notes: toNullIfEmpty(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error) {
    volver(LISTA, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(data.id);
  volver(`${LISTA}/${data.id}`, { toast: `Fecha ${number} creada. Cargá los resultados.` });
}

/** Guarda de una sola vez todos los resultados de la fecha. */
export async function guardarResultadosAction(formData: FormData) {
  const matchday_id = String(formData.get("matchday_id") ?? "");
  const ids = String(formData.get("player_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!matchday_id) {
    volver(LISTA, { error: "Falta el identificador de la fecha." });
    return;
  }

  const aGuardar: {
    matchday_id: string;
    player_id: string;
    matches_won: number;
    matches_lost: number;
  }[] = [];
  const aBorrar: string[] = [];

  for (const player_id of ids) {
    const g = Number(String(formData.get(`g_${player_id}`) ?? "").trim() || 0);
    const p = Number(String(formData.get(`p_${player_id}`) ?? "").trim() || 0);

    if (!Number.isInteger(g) || !Number.isInteger(p) || g < 0 || p < 0) {
      volver(`${LISTA}/${matchday_id}`, {
        error: "Los partidos ganados y perdidos tienen que ser números enteros no negativos.",
      });
      return;
    }

    if (g + p > 0) {
      aGuardar.push({ matchday_id, player_id, matches_won: g, matches_lost: p });
    } else {
      aBorrar.push(player_id);
    }
  }

  const supabase = await createSupabaseServer();

  if (aGuardar.length > 0) {
    const { error } = await supabase
      .from("matchday_results")
      .upsert(aGuardar, { onConflict: "matchday_id,player_id" });

    if (error) {
      volver(`${LISTA}/${matchday_id}`, { error: mensajeDeError(error.code, error.message) });
      return;
    }
  }

  // Los que quedaron en 0 y 0 dejan de participar en la fecha.
  if (aBorrar.length > 0) {
    const { error } = await supabase
      .from("matchday_results")
      .delete()
      .eq("matchday_id", matchday_id)
      .in("player_id", aBorrar);

    if (error) {
      volver(`${LISTA}/${matchday_id}`, { error: mensajeDeError(error.code, error.message) });
      return;
    }
  }

  refrescar(matchday_id);
  volver(`${LISTA}/${matchday_id}`, {
    toast: `Resultados guardados: ${aGuardar.length} jugador${aGuardar.length === 1 ? "" : "es"}.`,
  });
}

/** Cambia el estado de la fecha (borrador / completada / cancelada). */
export async function cambiarEstadoJornadaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as MatchdayStatus;

  if (!id || !["draft", "completed", "cancelled"].includes(status)) {
    volver(LISTA, { error: "Estado de fecha inválido." });
    return;
  }

  const supabase = await createSupabaseServer();

  // Una fecha no puede completarse vacía: no sumaría a nadie.
  if (status === "completed") {
    const { count } = await supabase
      .from("matchday_results")
      .select("id", { count: "exact", head: true })
      .eq("matchday_id", id);

    if ((count ?? 0) === 0) {
      volver(`${LISTA}/${id}`, {
        error: "No se puede completar una fecha sin resultados cargados.",
      });
      return;
    }
  }

  const { error } = await supabase.from("matchdays").update({ status }).eq("id", id);

  if (error) {
    volver(`${LISTA}/${id}`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  const textos: Record<MatchdayStatus, string> = {
    draft: "La fecha volvió a borrador y dejó de contar para la tabla.",
    completed: "Fecha completada. Ya cuenta para la tabla general.",
    cancelled: "Fecha cancelada. No cuenta para la tabla ni para la asistencia.",
  };

  refrescar(id);
  volver(`${LISTA}/${id}`, { toast: textos[status] });
}

/** Corrige número, fecha u observaciones de la fecha. */
export async function editarJornadaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const numeroRaw = String(formData.get("number") ?? "").trim();
  const number = Number(numeroRaw);

  if (!id) {
    volver(LISTA, { error: "Falta el identificador de la fecha." });
    return;
  }

  if (!numeroRaw || !Number.isInteger(number) || number <= 0) {
    volver(`${LISTA}/${id}`, {
      error: "El número de fecha tiene que ser un entero mayor que cero.",
    });
    return;
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("matchdays")
    .update({
      number,
      played_at: toNullIfEmpty(formData.get("played_at")),
      notes: toNullIfEmpty(formData.get("notes")),
    })
    .eq("id", id);

  if (error) {
    volver(`${LISTA}/${id}`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar(id);
  volver(`${LISTA}/${id}`, { toast: "Fecha actualizada." });
}

/** Elimina la fecha y, en cascada, sus resultados. */
export async function eliminarJornadaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("matchdays").delete().eq("id", id);

  if (error) {
    volver(`${LISTA}/${id}`, { error: mensajeDeError(error.code, error.message) });
    return;
  }

  refrescar();
  volver(LISTA, { toast: "Fecha eliminada." });
}
