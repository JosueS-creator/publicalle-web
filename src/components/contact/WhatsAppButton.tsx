import { m } from "motion/react";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2.5 21.5l4.6-1.06A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-2.73.63.65-2.66-.2-.31a8.2 8.2 0 1 1 6.76 3.67Zm4.5-6.13c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.47a.9.9 0 0 0-.66.31c-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.13.17 1.74 2.66 4.21 3.73.59.25 1.05.4 1.4.52.6.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

type Props = {
  variant?: "floating" | "inline";
  message?: string;
  label?: string;
  className?: string;
};

/** Botón de WhatsApp reutilizable. El número vive solo en src/config/contact.ts. */
export function WhatsAppButton({ variant = "inline", message, label = "Escríbenos por WhatsApp", className }: Props) {
  const href = whatsappUrl(message);
  if (variant === "floating") {
    return (
      <m.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 220, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-brand-green text-brand-blue-dark shadow-[0_12px_30px_-8px_rgb(34_201_180/0.7)] md:bottom-8 md:right-8",
          className,
        )}
      >
        <span className="absolute inset-0 rounded-full bg-brand-green opacity-40 animate-ping-wa" aria-hidden />
        <WhatsAppIcon className="relative size-7" />
      </m.a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "btn-sweep inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-brand-green px-6 font-semibold text-brand-blue-dark transition-colors hover:bg-brand-green-light",
        className,
      )}
    >
      <WhatsAppIcon className="size-5" />
      {label}
    </a>
  );
}
