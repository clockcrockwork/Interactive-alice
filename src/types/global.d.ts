import type { AliceProbe } from '../runtime/probe.ts';

declare global {
  interface Window {
    /** Present only when the probe is requested; see src/runtime/probe.ts. */
    __alice?: AliceProbe;
  }
}
