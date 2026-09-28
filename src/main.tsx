import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, MotionConfig } from "motion/react";
import App from "./App";
import "./styles/index.css";

// /admin, /portal, /operador y /entrar cargan la plataforma aparte (no pesa en la web pública)
const isPlatform = /^\/(admin|portal|operador|entrar)(\/|$)/.test(window.location.pathname);
const PlatformApp = lazy(() => import("./platform/PlatformApp"));

const loadFeatures = () => import("./lib/motionFeatures").then((r) => r.default);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        {isPlatform ? (
          <Suspense fallback={<div className="min-h-dvh" aria-hidden />}>
            <PlatformApp />
          </Suspense>
        ) : (
          <App />
        )}
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
