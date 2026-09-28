import { ArrowDown } from "lucide-react";
import { m } from "motion/react";
import { ButtonLink } from "@/components/ui/Button";
import { CampaignBrief } from "@/components/brief/CampaignBrief";
import { WhatsAppIcon } from "@/components/contact/WhatsAppButton";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { finalCta } from "@/data/site";
import { contact } from "@/config/contact";
import { whatsappUrl } from "@/lib/whatsapp";
import { reveal, stagger, viewportOnce } from "@/lib/motion";

/** 10 — CTA final + formulario para crear la campaña. */
export function FinalCta() {
  return (
    <section id="contacto" aria-labelledby="cta-title" className="relative overflow-hidden py-24 md:py-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgb(21_96_200/0.35),transparent_70%)]" aria-hidden />
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_50%_at_50%_20%,black,transparent)]" aria-hidden />

      <div className="container-pc relative">
        <m.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={viewportOnce} className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <m.div variants={reveal}>
            <Eyebrow index="10">{finalCta.eyebrow}</Eyebrow>
          </m.div>
          <m.h2 id="cta-title" variants={reveal} className="type-display mt-6 text-[clamp(2.4rem,6.6vw,5.4rem)]">
            ¿Listo para mover tu <span className="text-brand-green">próxima campaña?</span>
          </m.h2>
          <m.p variants={reveal} className="mt-6 max-w-[46ch] text-lg text-brand-white/75 md:text-xl">
            {finalCta.body}
          </m.p>
          <m.div variants={reveal} className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href={finalCta.primary.href} size="lg" icon={<ArrowDown className="size-5" aria-hidden />}>
              {finalCta.primary.label}
            </ButtonLink>
            <ButtonLink
              href={whatsappUrl(contact.whatsappDefaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="secondary"
              icon={<WhatsAppIcon className="size-5" />}
            >
              {finalCta.secondary.label}
            </ButtonLink>
          </m.div>
        </m.div>

        <m.div id="formulario" variants={reveal} initial="hidden" whileInView="show" viewport={viewportOnce} className="mx-auto mt-16 max-w-4xl scroll-mt-28 md:mt-24">
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-extrabold tracking-tight [font-stretch:115%]">{finalCta.formTitle}</h3>
            <p className="mt-2 text-brand-white/80">{finalCta.formNote}</p>
          </div>
          <CampaignBrief />
        </m.div>
      </div>
    </section>
  );
}
