/**
 * The apps-launcher glyph: a 3x3 grid of dots.
 *
 * Drawn rather than taken from the icon set because the launcher affordance is
 * near-universally nine dots, and the sets' "grid" glyphs are four large squares —
 * which reads as a layout toggle instead. Dots swell slightly when the panel is
 * open, so the button shows its own state.
 */
export const AppsGridIcon = ({ open = false, size = 20 }: { open?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {[3.5, 10, 16.5].map((cy) =>
      [3.5, 10, 16.5].map((cx) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={open ? 2.05 : 1.75}
          fill="currentColor"
          className="transition-all duration-200"
        />
      )),
    )}
  </svg>
);
