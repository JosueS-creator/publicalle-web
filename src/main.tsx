import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, MotionConfig } from "motion/react";
import App from "./App";
import "./styles/index.css";

const loadFeatures = () => import("./lib/motionFeatures").then((r) => r.default);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
