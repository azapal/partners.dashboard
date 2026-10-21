import { DEFAULT_APP_LOGO, LAYOUTS, type MobilityConfig, type ScreenId } from "../../lib/data/mobility";

/**
 * One phone, one screen, rendered live from the config.
 *
 * A real DOM render rather than a mock-up image, because the partner is
 * choosing a brand and can't choose one they can't see. Everything — header
 * treatment, nav treatment, colours, sections, which auth buttons appear — is
 * read from config at render time, so eight of these on a canvas all change
 * together the instant a value does.
 *
 * It renders the app's *shape*, not the app itself. The real client is a
 * separate build; this is an honest impression, which is why the frame is
 * labelled rather than pretending to be a screenshot.
 */

const tone = (config: MobilityConfig) => {
  const dark = config.theme === "dark";
  return {
    dark,
    surface: dark ? "#11161f" : "#ffffff",
    sunken: dark ? "#1a2130" : "#f4f6f9",
    ink: dark ? "#e8edf5" : "#101828",
    muted: dark ? "#8b97aa" : "#8a94a6",
    line: dark ? "#222c3d" : "#eef1f5",
  };
};

/**
 * The app's mark: the partner's logo, or Azapal's until they upload one. The
 * default sits on a white tile because it is drawn for a light background, and
 * the headers and splash it appears on are the partner's primary colour.
 */
const LogoMark = ({ config, className }: { config: MobilityConfig; className: string }) =>
  config.logo_url ? (
    <img src={config.logo_url} alt="" className={`${className} object-cover`} />
  ) : (
    <span className={`${className} flex items-center justify-center bg-white`}>
      {/* Sized against the tile, not padded: percentage padding resolves against the
          parent's width, which on a phone is far wider than the tile. */}
      <img src={DEFAULT_APP_LOGO} alt="" className="h-[64%] w-[64%] object-contain" />
    </span>
  );

const Header = ({ config, title }: { config: MobilityConfig; title: string }) => {
  const t = tone(config);
  const layout = LAYOUTS.find((l) => l.id === config.layout)!;
  const Logo = () => <LogoMark config={config} className="h-6 w-6 rounded-lg" />;

  if (layout.header === "hero") {
    return (
      <div
        className="px-4 pb-6 pt-3"
        style={{ background: `linear-gradient(135deg, ${config.primary}, ${config.accent})` }}
      >
        <div className="flex items-center gap-2">
          <Logo />
          <p className="truncate text-[11px] font-semibold text-white">{config.appName || "Your app"}</p>
        </div>
        <p className="mt-3 text-[15px] font-semibold leading-tight text-white">{title}</p>
        {config.tagline && <p className="mt-0.5 text-[8px] text-white/70">{config.tagline}</p>}
      </div>
    );
  }

  if (layout.header === "plain") {
    return (
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ background: t.surface, borderColor: t.line }}
      >
        <i className="ri-menu-line text-[13px]" style={{ color: t.ink }} />
        <p className="truncate text-[11px] font-semibold" style={{ color: t.ink }}>{title}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3 pt-2" style={{ background: config.primary }}>
      <div className="flex items-center gap-2">
        <Logo />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold leading-tight text-white">
            {config.appName || "Your app"}
          </p>
          {config.tagline && (
            <p className="truncate text-[8px] leading-tight text-white/70">{config.tagline}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Nav = ({ config }: { config: MobilityConfig }) => {
  const t = tone(config);
  const layout = LAYOUTS.find((l) => l.id === config.layout)!;
  const items = [
    ["ri-home-5-line", "Home", true],
    ["ri-map-pin-line", "Track", config.screens.track],
    ["ri-add-box-line", "Book", config.screens.book],
    ["ri-chat-3-line", "Chat", config.screens.chat],
    ["ri-user-line", "Me", config.screens.profile],
  ].filter(([, , on]) => on) as [string, string, boolean][];

  if (layout.nav === "drawer") {
    return (
      <div
        className="flex items-center justify-between border-t px-4 py-2"
        style={{ background: t.surface, borderColor: t.line }}
      >
        <span className="text-[7px]" style={{ color: t.muted }}>Menu in the drawer</span>
        <i className="ri-menu-line text-[11px]" style={{ color: config.primary }} />
      </div>
    );
  }

  if (layout.nav === "floating") {
    return (
      <div className="px-3 pb-2 pt-1" style={{ background: t.surface }}>
        <div
          className="flex items-center justify-around rounded-full px-2 py-1.5"
          style={{ background: config.primary }}
        >
          {items.map(([icon], i) => (
            <i key={icon} className={`${icon} text-[11px]`} style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,.55)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-around border-t px-2 py-2"
      style={{ background: t.surface, borderColor: t.line }}
    >
      {items.map(([icon, label], i) => (
        <span key={label} className="flex flex-col items-center gap-0.5">
          <i className={`${icon} text-[11px]`} style={{ color: i === 0 ? config.primary : t.muted }} />
          <span className="text-[6.5px] font-medium" style={{ color: i === 0 ? config.primary : t.muted }}>
            {label}
          </span>
        </span>
      ))}
    </div>
  );
};

const Body = ({ config, screen }: { config: MobilityConfig; screen: ScreenId }) => {
  const t = tone(config);
  const services = config.services.length ? config.services : ["Same-day", "Interstate"];

  if (screen === "signin") {
    const methods = [
      ["google", "ri-google-fill", "Continue with Google"],
      ["apple", "ri-apple-fill", "Continue with Apple"],
      ["email", "ri-mail-line", "Continue with email"],
      ["phone", "ri-smartphone-line", "Continue with phone"],
    ] as const;
    return (
      <div className="flex h-full flex-col justify-center px-4">
        <LogoMark config={config} className="mb-3 h-11 w-11 rounded-2xl shadow-sm" />
        <p className="text-[13px] font-semibold" style={{ color: t.ink }}>
          Welcome to {config.appName || "your app"}
        </p>
        <p className="mt-0.5 text-[8px]" style={{ color: t.muted }}>Sign in to book and track.</p>
        <div className="mt-4 space-y-1.5">
          {methods.filter(([k]) => config.auth[k]).map(([k, icon, label]) => (
            <div
              key={k}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2"
              style={{
                background: k === "email" || k === "phone" ? config.primary : t.sunken,
                color: k === "email" || k === "phone" ? "#fff" : t.ink,
              }}
            >
              <i className={`${icon} text-[10px]`} />
              <span className="text-[8px] font-semibold">{label}</span>
            </div>
          ))}
          {!Object.values(config.auth).some(Boolean) && (
            <p className="rounded-lg px-2 py-3 text-center text-[8px]" style={{ background: t.sunken, color: t.muted }}>
              No sign-in method enabled
            </p>
          )}
        </div>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <>
        <div className="rounded-xl p-3" style={{ background: t.sunken }}>
          <p className="text-[8px] font-medium" style={{ color: t.muted }}>Send a package</p>
          <p className="mt-0.5 text-[11px] font-semibold" style={{ color: t.ink }}>Where to today?</p>
          <div className="mt-2 rounded-lg px-2 py-1.5 text-[8px]" style={{ background: t.surface, color: t.muted }}>
            <i className="ri-search-line mr-1" />Enter a destination
          </div>
        </div>

        {config.sections.map((section) => (
          <div key={section.id} className="mt-3">
            <p className="text-[9px] font-semibold" style={{ color: t.ink }}>{section.title}</p>

            {section.type === "services" && (
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {services.slice(0, 4).map((s) => (
                  <div key={s} className="rounded-lg px-2 py-2" style={{ background: t.sunken }}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] text-white" style={{ background: config.accent }}>
                      <i className="ri-truck-line" />
                    </span>
                    <p className="mt-1 truncate text-[8px] font-semibold" style={{ color: t.ink }}>{s}</p>
                  </div>
                ))}
              </div>
            )}

            {section.type === "carousel" && (
              <div className="mt-1.5 flex gap-1.5 overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex h-14 w-20 shrink-0 items-end rounded-lg p-1.5"
                    style={{
                      background: section.media?.[i]
                        ? `url(${section.media[i]}) center/cover`
                        : i === 0 ? config.primary : t.sunken,
                    }}
                  >
                    <span className="text-[6.5px] font-semibold" style={{ color: i === 0 && !section.media?.[i] ? "#fff" : t.muted }}>
                      {i === 0 ? section.body || "Promo" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {section.type === "image" && (
              <div
                className="mt-1.5 flex h-16 items-center justify-center rounded-lg"
                style={{ background: section.media?.[0] ? `url(${section.media[0]}) center/cover` : t.sunken }}
              >
                {!section.media?.[0] && <i className="ri-image-line text-[14px]" style={{ color: t.muted }} />}
              </div>
            )}

            {section.type === "video" && (
              <div className="mt-1.5 flex h-16 items-center justify-center rounded-lg" style={{ background: "#0b0f17" }}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                  <i className="ri-play-fill text-[10px] text-white" />
                </span>
              </div>
            )}

            {section.type === "text" && (
              <p className="mt-1 text-[8px] leading-3" style={{ color: t.muted }}>
                {section.body || "Your announcement text sits here."}
              </p>
            )}
          </div>
        ))}
      </>
    );
  }

  if (screen === "track") {
    return (
      <>
        <div className="rounded-xl p-3" style={{ background: t.sunken }}>
          <p className="text-[8px]" style={{ color: t.muted }}>Order</p>
          <p className="text-[10px] font-semibold" style={{ color: t.ink }}>AZP-4471</p>
          <div className="mt-2.5 space-y-2">
            {[["Picked up", true], ["In transit", true], ["Out for delivery", false], ["Delivered", false]].map(
              ([label, done]) => (
                <div key={label as string} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: done ? config.accent : t.muted, opacity: done ? 1 : 0.4 }} />
                  <span className="text-[8px]" style={{ color: done ? t.ink : t.muted, fontWeight: done ? 600 : 400 }}>
                    {label as string}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
        {config.screens.chat && (
          <div className="mt-2.5 rounded-lg px-2.5 py-2 text-[8px] font-semibold text-white" style={{ background: config.primary }}>
            <i className="ri-chat-3-line mr-1" />Message your rider
          </div>
        )}
      </>
    );
  }

  if (screen === "book") {
    return (
      <>
        {["Pickup address", "Drop-off address", "Package details"].map((field) => (
          <div key={field} className="mb-2">
            <p className="text-[7.5px] font-medium" style={{ color: t.muted }}>{field}</p>
            <div className="mt-0.5 rounded-lg px-2 py-1.5 text-[8px]" style={{ background: t.sunken, color: t.muted }}>
              Tap to enter
            </div>
          </div>
        ))}
        <div className="mt-3 rounded-xl p-2.5" style={{ background: t.sunken }}>
          <div className="flex items-center justify-between">
            <span className="text-[8px]" style={{ color: t.muted }}>Estimated</span>
            <span className="text-[10px] font-semibold" style={{ color: t.ink }}>₦3,200</span>
          </div>
        </div>
        <div className="mt-2.5 rounded-lg py-2 text-center text-[9px] font-semibold text-white" style={{ background: config.primary }}>
          Confirm booking
        </div>
      </>
    );
  }

  if (screen === "chat") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-2">
          {[
            ["them", "I'm 5 minutes away from pickup."],
            ["me", "Great — the gate code is 2240."],
            ["them", "Got it, thanks."],
          ].map(([who, text], i) => (
            <div key={i} className={`flex ${who === "me" ? "justify-end" : "justify-start"}`}>
              <p
                className="max-w-[78%] rounded-xl px-2 py-1.5 text-[8px] leading-3"
                style={{
                  background: who === "me" ? config.primary : t.sunken,
                  color: who === "me" ? "#fff" : t.ink,
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-1.5" style={{ background: t.sunken }}>
          <span className="flex-1 text-[8px]" style={{ color: t.muted }}>Message…</span>
          <i className="ri-send-plane-2-fill text-[9px]" style={{ color: config.primary }} />
        </div>
      </div>
    );
  }

  if (screen === "profile") {
    const fields = config.profileFields.filter((f) => f.enabled);
    return (
      <>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: config.accent }}>
            AO
          </span>
          <div>
            <p className="text-[10px] font-semibold" style={{ color: t.ink }}>Amaka Obi</p>
            <p className="text-[8px]" style={{ color: t.muted }}>Customer since 2025</p>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {fields.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg px-2 py-1.5" style={{ background: t.sunken }}>
              <span className="text-[8px]" style={{ color: t.ink }}>{f.label}</span>
              <i className="ri-arrow-right-s-line text-[10px]" style={{ color: t.muted }} />
            </div>
          ))}
          {fields.length === 0 && (
            <p className="rounded-lg px-2 py-3 text-center text-[8px]" style={{ background: t.sunken, color: t.muted }}>
              No profile fields shown
            </p>
          )}
        </div>
      </>
    );
  }

  if (screen === "settings") {
    return (
      <div className="space-y-1">
        {[
          ["ri-notification-3-line", "Notifications"],
          ["ri-global-line", "Language"],
          ["ri-moon-line", "Appearance"],
          ["ri-lock-line", "Privacy"],
          ["ri-shield-check-line", "Security"],
          ["ri-question-line", "Help & support"],
          ["ri-logout-box-r-line", "Sign out"],
        ].map(([icon, label]) => (
          <div key={label} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: t.sunken }}>
            <i className={`${icon} text-[10px]`} style={{ color: config.primary }} />
            <span className="flex-1 text-[8px]" style={{ color: t.ink }}>{label}</span>
            <i className="ri-arrow-right-s-line text-[10px]" style={{ color: t.muted }} />
          </div>
        ))}
      </div>
    );
  }

  // legal
  return (
    <>
      <p className="text-[9px] font-semibold" style={{ color: t.ink }}>Privacy policy</p>
      <p className="mt-1 text-[7px] leading-[10px]" style={{ color: t.muted }}>
        {config.legal.privacy.slice(0, 260)}…
      </p>
      <p className="mt-3 text-[9px] font-semibold" style={{ color: t.ink }}>Terms & conditions</p>
      <p className="mt-1 text-[7px] leading-[10px]" style={{ color: t.muted }}>
        {config.legal.terms.slice(0, 200)}…
      </p>
    </>
  );
};

/** The first thing a customer sees: the brand, full-bleed, while the app loads. */
const Splash = ({ config }: { config: MobilityConfig }) => (
  <div
    className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    style={{ background: `linear-gradient(160deg, ${config.primary}, ${config.accent})` }}
  >
    <LogoMark config={config} className="h-16 w-16 rounded-[1.25rem] shadow-lg shadow-black/20" />
    <p className="mt-4 text-[15px] font-semibold leading-tight text-white">{config.appName || "Your app"}</p>
    {config.tagline && <p className="mt-1 text-[9px] text-white/75">{config.tagline}</p>}
    <i className="ri-loader-4-line mt-8 animate-spin text-[14px] text-white/70" />
  </div>
);

const TITLES: Record<ScreenId, string> = {
  splash: "Splash", signin: "Sign in", home: "Home", track: "Tracking", book: "New booking",
  chat: "Chat", profile: "Profile", settings: "Settings", legal: "Legal",
};

export const PhoneFrame = ({
  config,
  screen,
  label,
}: {
  config: MobilityConfig;
  screen: ScreenId;
  label?: string;
}) => {
  const t = tone(config);
  const splash = screen === "splash";
  const chromeless = splash || screen === "signin";
  // The status bar sits on the splash colour, so its icons go white there.
  const barInk = splash ? "#ffffff" : t.ink;

  return (
    <div className="phone-type w-[248px] shrink-0">
      {/* Fixed height, so screens with and without a header and tab bar line up on the canvas. */}
      <div
        className="flex h-[500px] flex-col overflow-hidden rounded-[2.2rem] border-[7px] border-slate-900 shadow-2xl shadow-slate-900/25"
        style={{ background: splash ? config.primary : t.surface }}
      >
        <div className="relative flex shrink-0 items-center justify-between px-4 pt-2.5 pb-1" style={{ background: splash ? config.primary : t.surface }}>
          <span className="text-[9px] font-medium" style={{ color: barInk }}>9:41</span>
          <span className="absolute left-1/2 top-1 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-slate-900" />
          <span className="flex items-center gap-1 text-[9px]" style={{ color: barInk }}>
            <i className="ri-signal-wifi-line" />
            <i className="ri-battery-line" />
          </span>
        </div>

        {splash ? (
          <Splash config={config} />
        ) : (
          <>
            {!chromeless && <Header config={config} title={TITLES[screen]} />}
            <div className="min-h-0 flex-1 overflow-hidden px-3.5 py-3" style={{ background: t.surface }}>
              <Body config={config} screen={screen} />
            </div>
          </>
        )}

        {!chromeless && <Nav config={config} />}
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold text-slate-500">{label ?? TITLES[screen]}</p>
    </div>
  );
};
