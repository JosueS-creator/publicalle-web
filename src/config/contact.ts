/**
 * DATOS DE CONTACTO de Publicalle (vigentes hasta nuevo aviso).
 * Todos los componentes leen de aquí; no hay números repetidos en el código.
 */
const envWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;

/** Formato internacional sin "+" ni espacios. Ej: 50499998888 */
export const WHATSAPP_NUMBER = envWhatsApp?.trim() || "50487401299";

export const contact = {
  whatsapp: WHATSAPP_NUMBER,
  whatsappDefaultMessage: "Hola Publicalle, quiero cotizar una campaña.",
  phone: "+504 8740-1299",
  phoneHref: "tel:+50487401299",
  email: "ventaspublicalle@gmail.com",
  city: "Cobertura en toda Honduras",
  // Instagram/TikTok: agregar aquí cuando existan las cuentas (el ícono ya está en SocialIcon)
  social: [
    // Búsqueda de la página hasta tener el enlace directo (facebook.com/…)
    { id: "facebook", label: "Publicalle Honduras", href: "https://www.facebook.com/search/top?q=Publicalle%20Honduras" },
  ] as { id: SocialId; label: string; href: string }[],
} as const;

export type SocialId = "facebook" | "instagram" | "tiktok";
