import { WHATSAPP_NUMBER, contact } from "@/config/contact";

/** Construye el enlace wa.me con mensaje prellenado. Única función que conoce el número. */
export function whatsappUrl(message: string = contact.whatsappDefaultMessage) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
