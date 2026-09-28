import { NationalCoverage } from "./NationalCoverage";
import { Services } from "./Services";
import { Move } from "./Move";
import { Events } from "./Events";
import { Place } from "./Place";
import { CombinedCampaigns } from "./CombinedCampaigns";
import { Data } from "./Data";
import { HowItWorks } from "./HowItWorks";
import { Coverage } from "./Coverage";
import { FinalCta } from "./FinalCta";

/** Todo lo que viene después del hero: se carga en un chunk aparte (code splitting). */
export default function BelowTheFold() {
  return (
    <>
      <NationalCoverage />
      <Services />
      <Move />
      <Events />
      <Place />
      <CombinedCampaigns />
      <Data />
      <HowItWorks />
      <Coverage />
      <FinalCta />
    </>
  );
}
