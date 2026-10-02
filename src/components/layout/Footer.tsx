import { Mail, MapPin, Phone } from "lucide-react";
import { PublicalleLogo } from "@/components/brand/PublicalleLogo";
import { WhatsAppIcon } from "@/components/contact/WhatsAppButton";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { contact } from "@/config/contact";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { serviceLines } from "@/data/services";
import { brandMessage } from "@/data/site";
import { hrefSitio } from "@/config/navigation";

const footerLinks = [
  ...serviceLines.map((l) => ({ label: `Publicalle ${l.name[0]}${l.name.slice(1).toLowerCase()}`, href: l.href })),
  { label: "PubliEscuela", href: "/publi-escuela" },
  { label: "Campañas combinadas", href: "#campanas-combinadas" },
  { label: "Cobertura", href: "#cobertura" },
  { label: "Crear una campaña", href: "#contacto" },
  { label: "Portal de clientes", href: "/entrar" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-brand-bg">
      <div className="container-pc relative grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <PublicalleLogo theme="dark" height={56} />
          <p className="mt-6 max-w-xs text-lg font-semibold text-brand-white [font-stretch:112%]">{brand.tagline}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{brandMessage}</p>
        </div>

        <nav aria-label="Pie de página" className="md:col-span-3">
          <h2 className="type-eyebrow text-muted">Ecosistema</h2>
          <ul className="mt-4 space-y-3">
            {footerLinks.map((l) => (
              <li key={l.href}>
                <a href={hrefSitio(l.href)} className="text-brand-white/80 transition-colors hover:text-brand-green">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="type-eyebrow text-muted">Contacto</h2>
          <ul className="mt-4 space-y-3 text-brand-white/80">
            <li>
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-brand-green">
                <WhatsAppIcon className="size-4" /> WhatsApp
              </a>
            </li>
            <li>
              <a href={contact.phoneHref} className="inline-flex items-center gap-2.5 hover:text-brand-green">
                <Phone className="size-4" aria-hidden /> {contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2.5 hover:text-brand-green">
                <Mail className="size-4" aria-hidden /> {contact.email}
              </a>
            </li>
            <li className="inline-flex items-center gap-2.5">
              <MapPin className="size-4" aria-hidden /> {contact.city}
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h2 className="type-eyebrow text-muted">Redes</h2>
          <ul className="mt-4 flex gap-2">
            {contact.social.map((s) => (
              <li key={s.id}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2.5 rounded-full pr-4 pl-3 text-sm text-brand-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/10 hover:text-brand-green"
                >
                  <SocialIcon id={s.id} className="size-[18px]" />
                  <span className="whitespace-nowrap">{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-pc flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {site.year} {brand.legalName}. Todos los derechos reservados.</p>
          <p className="type-data">14.0723° N · 87.1921° O</p>
        </div>
      </div>
    </footer>
  );
}
