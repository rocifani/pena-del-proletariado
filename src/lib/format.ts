/** Helpers de formato para mostrar datos en pantalla. */

/** Devuelve null si el string esta vacio o solo tiene espacios. */
export function toNullIfEmpty(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

/** Formatea un numero con coma decimal, sin decimales de mas. */
export function num(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Formatea un porcentaje. */
export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${num(value, 1)}%`;
}

/**
 * Fecha de hoy en Argentina, como YYYY-MM-DD.
 * Usamos la zona explícita porque el servidor de Vercel corre en UTC y de noche
 * nos daría el día siguiente.
 */
export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Formatea una fecha ISO (YYYY-MM-DD) en formato local, sin corrimiento de zona. */
export function fecha(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}
