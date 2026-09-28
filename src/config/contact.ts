/**
 * ⚠️ DATOS DE CONTACTO — reemplazar antes de publicar.
 * Todos los componentes leen de aquí; no hay números repetidos en el código.
 */
const envWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;

/** Formato internacional sin "+" ni espacios. Ej: 50499998888 */
export const WHATSAPP_NUMBER = envWhatsApp?.trim() || "50400000000";

export const contact = {
  whatsapp: WHATSAPP_NUMBER,
  whatsappDefaultMessage: "Hola Publicalle, quiero cotizar una campaña.",
  phone: "+504 0000-0000",
  phoneHref: "tel:+50400000000",
  email: "hola@publicalle.com",
  city: "Cobertura en toda Honduras",
  social: [
    { id: "facebook", label: "Facebook", href: "https://facebook.com/" },
    { id: "instagram", label: "Instagram", href: "https://instagram.com/" },
    { id: "tiktok", label: "TikTok", href: "https://tiktok.com/" },
  ],
} as const;

export type SocialId = (typeof contact.social)[number]["id"];
