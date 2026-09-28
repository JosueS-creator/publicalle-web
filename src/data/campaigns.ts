import type { Campaign } from "@/types";
import carpa from "@/assets/media/events/carpas/events-carpa-01-800.webp";
import audio from "@/assets/media/events/audio/events-audio-01-800.webp";
import animacion from "@/assets/media/events/animacion/events-animacion-01-540.webp";
import promotores from "@/assets/media/events/promotores/events-promotores-01-800.webp";
import sello from "@/assets/media/data/data-evidencia-sello-01-600.webp";

/**
 * BORRADORES de casos armados a partir de fotografía real (ver docs/photo-inventory.md).
 * NO se muestran en la home: falta cliente confirmado, objetivo, duración, resultados y
 * autorización para usar la marca del cliente. Solo se registra lo que la foto muestra;
 * lugar y fecha únicamente cuando vienen impresos en el sello de la propia foto.
 * Para publicar: completar los campos "Por confirmar", poner isPlaceholder en false
 * y renderizar <CampaignGrid campaigns={campaigns} />.
 */
const PENDIENTE = "Por confirmar";

export const campaigns: Campaign[] = [
  {
    id: "borrador-activacion-farmacia",
    title: "Activación en farmacia",
    type: "Activación",
    location: "San Pedro Sula (según sello de la foto, 22/09/2021)",
    duration: PENDIENTE,
    format: "Mascota inflable + ruleta de premios + promotoras",
    service: "events",
    image: animacion,
    imageAlt: "Activación dentro de una farmacia con mascota inflable y ruleta de premios",
    isPlaceholder: true,
  },
  {
    id: "borrador-carpa-audio-pinturas",
    title: "Activación con carpa y audio",
    type: "Activación",
    location: PENDIENTE,
    duration: PENDIENTE,
    format: "Carpa de marca + animador + audio + módulo de producto",
    service: "events",
    image: audio,
    imageAlt: "Animador con micrófono bajo una carpa de marca, con parlante en trípode",
    isPlaceholder: true,
  },
  {
    id: "borrador-aniversario-comercio",
    title: "Activación en aniversario de comercio",
    type: "Activación",
    location: PENDIENTE,
    duration: PENDIENTE,
    format: "Carpa + bandera tipo pluma + audio + promotora",
    service: "events",
    image: carpa,
    imageAlt: "Carpa con banner de marca y bandera tipo pluma frente a un comercio",
    isPlaceholder: true,
  },
  {
    id: "borrador-promotora-modulo",
    title: "Promotora en módulo de marca",
    type: "Impulso de marca",
    location: PENDIENTE,
    duration: PENDIENTE,
    format: "Módulo impulsador + material promocional",
    service: "events",
    image: promotores,
    imageAlt: "Promotora en un módulo de marca frente a una tienda",
    isPlaceholder: true,
  },
  {
    id: "borrador-pendones-caminantes",
    title: "Publicidad caminante con pendones",
    type: "Recorrido a pie",
    location: "San Pedro Sula (según sello de la foto, 21/12/2023)",
    duration: PENDIENTE,
    format: "Pendones portados por personas",
    service: "move",
    image: sello,
    imageAlt: "Tres personas con pendones publicitarios caminando por la acera",
    isPlaceholder: true,
  },
];
