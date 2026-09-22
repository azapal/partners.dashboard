import type { AssistantStatus } from "../../store/client/assistant";

/**
 * The Azapal presence.
 *
 * Built from stacked gradient layers rather than a canvas or an SVG turbulence
 * filter: it costs almost nothing on the low-end Android a branch manager is
 * likely holding, and it still reads as alive. What sells it is that the layer
 * durations are coprime (7s / 11s / 13s / 17s) — the composite never returns to
 * the same arrangement, so the eye never catches a loop point, which is the
 * thing that makes a "breathing" element look canned.
 *
 * Status drives tempo, not shape, so transitions between states are continuous:
 *   idle     — slow breathing
 *   thinking — faster, the inner core counter-rotates
 *   acting   — brightest and quickest
 *   error    — desaturated, nearly still
 *
 * All motion is disabled under prefers-reduced-motion (see index.css), where it
 * degrades to a static gradient sphere.
 */
export const AzapalOrb = ({
  status = "idle",
  size = 140,
}: {
  status?: AssistantStatus;
  size?: number;
}) => (
  <div
    className={`azapal-orb azapal-orb--${status} relative shrink-0`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    {/* Outer bloom — the light the orb throws onto the backdrop. */}
    <span className="azapal-orb__aura" />
    {/* Rotating body, two counter-spinning conic sweeps. */}
    <span className="azapal-orb__sweep azapal-orb__sweep--a" />
    <span className="azapal-orb__sweep azapal-orb__sweep--b" />
    {/* Bright core with its own breath. */}
    <span className="azapal-orb__core" />
    {/* Weather inside the body — drifting blobs, offset from the core's breath. */}
    <span className="azapal-orb__plasma" />
    {/* Specular highlight, keeps it reading as a sphere rather than a disc. */}
    <span className="azapal-orb__gloss" />
  </div>
);
