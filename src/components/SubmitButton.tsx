"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

/**
 * Botón de envío de formulario.
 *
 * Si se pasa `confirmMessage`, en vez de enviar directo abre un modal propio
 * (nada de window.confirm) y recién confirma desde ahí. El modal vive dentro
 * del mismo <form>, así que su botón de confirmar es un submit normal.
 */
export default function SubmitButton({
  idleText = "Guardar",
  loadingText = "Guardando...",
  className = "btn btn-primary",
  confirmMessage,
  confirmTitle,
  confirmText,
}: {
  idleText?: string;
  loadingText?: string;
  className?: string;
  confirmMessage?: string;
  confirmTitle?: string;
  confirmText?: string;
}) {
  const { pending } = useFormStatus();
  const [abierto, setAbierto] = useState(false);

  const esDestructivo = className.includes("btn-danger");

  // Cerrar con Escape y bloquear el scroll de fondo
  useEffect(() => {
    if (!abierto) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }

    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  // Cuando termina el envío, cerramos el modal
  useEffect(() => {
    if (!pending) setAbierto(false);
  }, [pending]);

  // Sin confirmación: botón común y listo
  if (!confirmMessage) {
    return (
      <button type="submit" disabled={pending} className={className}>
        {pending && <Spinner />}
        {pending ? loadingText : idleText}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setAbierto(true)}
        className={className}
      >
        {pending && <Spinner />}
        {pending ? loadingText : idleText}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmTitle ?? idleText}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          {/* Fondo */}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 cursor-default bg-black/50"
          />

          {/* Panel: hoja inferior en mobile, tarjeta centrada en desktop */}
          <div
            className="relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl
                       dark:bg-gray-800 sm:rounded-2xl"
          >
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {confirmTitle ?? idleText}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {confirmMessage}
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={pending}
                className="btn btn-secondary"
              >
                Volver
              </button>

              <button
                type="submit"
                disabled={pending}
                autoFocus
                className={esDestructivo ? "btn btn-danger" : "btn btn-primary"}
              >
                {pending && <Spinner />}
                {pending ? loadingText : (confirmText ?? "Confirmar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
