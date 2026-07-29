/**
 * Traduce errores de Postgres / Supabase a mensajes entendibles.
 * Los códigos vienen en error.code de PostgREST.
 */
export function mensajeDeError(code: string | undefined, message: string): string {
  switch (code) {
    case "23505":
      // Violación de índice único
      if (message.includes("tournaments_single_active_idx")) {
        return "Ya hay otro torneo activo. Cerralo o cancelalo antes de activar este.";
      }
      if (message.includes("matchdays_tournament_id_number_key")) {
        return "Ya existe una fecha con ese número en este torneo.";
      }
      if (message.includes("players_display_name_unique_idx")) {
        return "Ya existe un jugador con ese nombre.";
      }
      if (message.includes("matchday_results_matchday_id_player_id_key")) {
        return "Ese jugador ya estaba cargado en la fecha.";
      }
      return "Ya existe un registro con esos datos.";

    case "23503":
      return "No se puede borrar: hay datos que dependen de este registro.";

    case "23514":
      // CHECK constraint
      if (message.includes("matches_won") || message.includes("matches_lost")) {
        return "Los partidos ganados y perdidos no pueden ser negativos, y tiene que haber al menos uno.";
      }
      if (message.includes("end_date")) {
        return "La fecha de finalización no puede ser anterior a la de inicio.";
      }
      return "Los datos no cumplen una validación de la base.";

    case "42501":
      return "No tenés permisos para hacer esto. Puede que se haya cerrado la sesión.";

    case "P0001":
      // RAISE EXCEPTION de nuestros triggers: el mensaje ya es en castellano
      return message;

    default:
      return message;
  }
}
