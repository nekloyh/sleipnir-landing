import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  motion,
  MotionConfig,
  useMotionValue,
  useSpring,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";
import "./styles.css";

/* ------------------------------------------------------------------ *
 * Content — sourced from the Sleipnir product docs (C2-App-154).
 * Anything not yet verified against hardware is flagged `tbd: true`
 * and rendered as an explicit placeholder.
 * ------------------------------------------------------------------ */

const navItems = [
  ["Product", "product"],
  ["How it works", "flow"],
  ["Fleet", "fleet"],
  ["Coverage", "coverage"],
  ["Contact", "contact"],
];

// Real numbers from the Ocean Park beachhead (PROJECT_OVERVIEW.md).
const stats = [
  ["66", "apartment towers", "a WinMart at the base of nearly every one"],
  ["3,500", "low-rise homes", "packed into the same enclosed grounds"],
  ["423", "hectares, one map", "≈13k nodes · 15k edges, fully mapped"],
  ["500+", "on-site shops", "in the Sao Biển subzone alone"],
];

const flow = [
  [
    "Order",
    "A resident sends from an on-site shop",
    "No public app on the street — Sleipnir serves people through the merchants and management inside one community.",
  ],
  [
    "Dispatch",
    "The engine scores the fleet and picks a robot",
    "Dispatch weighs distance, battery and load, then commits — and the Copilot narrates why in plain language. The engine decides; the AI only explains.",
  ],
  [
    "Handoff",
    "The shop accepts, then hands off",
    "Two deliberate gates: accept unlocks dispatch, hand-off releases the robot. Nothing leaves the counter by accident.",
  ],
  [
    "Track & reroute",
    "Live ETA, and a calm reroute if a path blocks",
    "A blocked or expensive edge forces a new route in real time; the recipient gets a polite notice, not silence.",
  ],
  [
    "Pickup code",
    "The recipient confirms with a code",
    "The cargo bay stays locked until the right code is entered — with attempt lockout — then the order completes.",
  ],
];

// Live fleet roster (robotics/fleet.json). Batteries are the seeded demo values.
const fleet = [
  {
    id: "R-01",
    name: "Library Runner",
    home: "Rainbow 8035",
    battery: 91,
    status: "Ready",
    state: "ready",
    note: "Physical unit · Webots telemetry authoritative",
    img: "/robots/robot-front.webp",
  },
  {
    id: "R-02",
    name: "Vincom Scout",
    home: "Vincom Ocean Park",
    battery: 87,
    status: "Delivering",
    state: "delivering",
    note: "Simulated unit · on a live demo route",
    img: "/robots/robot-side.webp",
  },
  {
    id: "R-03",
    name: "VinUni Courier",
    home: "VinUniversity",
    battery: 94,
    status: "Charging",
    state: "charging",
    note: "Simulated unit · topping up at depot",
    img: "/robots/robot-rear.webp",
  },
];

// Anatomy call-outs keyed to the robot render. `x`/`y` are % positions.
const anatomy = [
  ["01", "Stereo camera pair", "Two eyes read depth, so it sees a curb, a bag or a child before it reaches them.", 44, 34],
  ["02", "Intent light bar", "A wide LED strip tells pedestrians what it is about to do — the courier that signals before it moves.", 40, 47],
  ["03", "Status face + e-stop", "Task, mode and battery on a readable panel, with one red button that stops everything.", 43, 58],
  ["04", "Locked cargo bay", "Insulated, sealed, and opened only by the recipient's pickup code.", 66, 40],
  ["05", "Articulated 4-wheel chassis", "Independent suspension keeps all four wheels down over curbs and thresholds — steadiness in motion.", 60, 78],
];

// Full specification. `tbd` values await the hardware pilot (Phase D).
const specGroups = [
  [
    "Autonomy",
    [
      ["Navigation stack", "ROS 2 · Nav2 · MPPI", false],
      ["Perception", "Stereo vision + optional VLM pilot", false],
      ["Operating map", "≈13k nodes / 15k edges", false],
      ["Localization", "Geofenced, pre-mapped area", false],
    ],
  ],
  [
    "Operation",
    [
      ["Deployment model", "Delivery-as-a-Service (B2B2C)", false],
      ["Environment", "Enclosed, low-speed private roads", false],
      ["Fleet in program", "3 robots (R-01 – R-03)", false],
      ["Robot state proof", "Simulation-first (Webots)", false],
    ],
  ],
  [
    "Chassis — pending hardware pilot",
    [
      ["Payload", "TBD", true],
      ["Cargo volume", "TBD", true],
      ["Cruising speed", "TBD", true],
      ["Range per charge", "TBD", true],
      ["Battery capacity", "TBD", true],
      ["Ingress protection", "TBD", true],
    ],
  ],
];

// Coverage pins over the Ocean Park grounds. Coordinates are approximate,
// derived from the seeded fleet homes; treat as illustrative.
const coveragePins = [
  ["Sao Biển subzone", "500+ shops", 30, 64, "hot"],
  ["Vincom Ocean Park", "Retail anchor", 62, 38, "node"],
  ["VinUniversity", "Campus depot", 26, 30, "node"],
  ["Rainbow towers", "Residential", 70, 70, "node"],
  ["Dormitory", "Student housing", 48, 50, "node"],
];

// Editorial pipeline — cards go live as the posts are published.
const insights = [
  ["Why a gated community is easy-mode for autonomy", "Field note", "Coming soon"],
  ["Anti-chatbot: the engine decides, the AI explains", "Architecture", "Coming soon"],
  ["Reading a reroute: incidents without the panic", "Operations", "Coming soon"],
];

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Right-rail section navigation for the snap-scroll experience.
const sectionNav = [
  ["top", "Home"],
  ["thesis", "Thesis"],
  ["stats", "Ocean Park"],
  ["product", "Product"],
  ["flow", "How it works"],
  ["fleet", "Fleet"],
  ["coverage", "Coverage"],
  ["contact", "Contact"],
];
const darkSections = new Set(["top", "thesis", "flow", "coverage", "contact"]);

const marqueePhrases = [
  "The courier that never stumbles",
  "Steadiness in motion",
  "Last-mile, inside the gates",
  "Delivery-as-a-Service",
  "Proven in simulation",
];

// Kinetic running-text band — the one bit of motion typography on the page.
function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((group) => (
          <div className="marquee-group" key={group}>
            {marqueePhrases.map((phrase, i) => (
              <span className="marquee-item" key={`${group}-${i}`}>
                <span className="marquee-text">{phrase}</span>
                <span className="marquee-dot" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionNav() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const els = sectionNav
      .map(([id]) => document.getElementById(id))
      .filter(Boolean);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={`section-nav ${darkSections.has(active) ? "on-dark" : ""}`}
      aria-label="Section navigation"
    >
      {sectionNav.map(([id, label]) => (
        <button
          key={id}
          className={`section-dot ${active === id ? "is-active" : ""}`}
          type="button"
          onClick={() => scrollToId(id)}
          aria-label={label}
          aria-current={active === id}
        >
          <span className="dot-label">{label}</span>
          <span className="dot" />
        </button>
      ))}
    </nav>
  );
}

const easeOutExpo = [0.19, 1, 0.22, 1];

// A small vocabulary of entrances so different content enters differently:
// copy slides from its own side, media scales in, numbers rise with a blur,
// grouped cards stagger. Keeps every section from arriving the same way.
function revealStates(variant, y) {
  switch (variant) {
    case "left":
      return { hidden: { opacity: 0, x: -46 }, show: { opacity: 1, x: 0 } };
    case "right":
      return { hidden: { opacity: 0, x: 46 }, show: { opacity: 1, x: 0 } };
    case "scale":
      return { hidden: { opacity: 0, scale: 0.92, y: 20 }, show: { opacity: 1, scale: 1, y: 0 } };
    case "blur":
      return {
        hidden: { opacity: 0, y: 26, filter: "blur(12px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)" },
      };
    case "up":
    default:
      return { hidden: { opacity: 0, y: y ?? 40 }, show: { opacity: 1, y: 0 } };
  }
}

const Reveal = ({
  children,
  className,
  as = "div",
  delay = 0,
  variant = "up",
  y,
  duration = 0.85,
  style,
  ...props
}) => {
  const Component = motion[as];
  const states = revealStates(variant, y);
  return (
    <Component
      className={className}
      initial={states.hidden}
      whileInView={states.show}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration, ease: easeOutExpo, delay }}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
};

// Container that staggers its <Item> children into view.
const Stagger = ({ children, className, as = "div", gap = 0.09, delay = 0, style, ...props }) => {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-12%" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
};

const itemUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOutExpo } },
};
const itemPop = {
  hidden: { opacity: 0, y: 22, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: easeOutExpo } },
};
const itemRight = {
  hidden: { opacity: 0, x: 34 },
  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: easeOutExpo } },
};
// Opacity-only — for elements whose CSS transform (e.g. centering) must survive.
const itemFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: easeOutExpo } },
};

const Item = ({ children, className, as = "div", variants = itemUp, style, ...props }) => {
  const Component = motion[as];
  return (
    <Component className={className} variants={variants} style={style} {...props}>
      {children}
    </Component>
  );
};

/* Count-up that fires when scrolled into view. Preserves separators/suffix. */
function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(value.replace(/\d/g, "0"));

  useEffect(() => {
    if (!inView) return;
    const match = value.match(/[\d,]+/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const target = Number(match[0].replace(/,/g, ""));
    const prefix = value.slice(0, match.index);
    const suffix = value.slice(match.index + match[0].length);
    const format = (n) => prefix + n.toLocaleString("en-US") + suffix;
    const duration = 1100;
    let raf;
    let start;
    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(format(Math.round(target * eased)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref}>{display}</span>;
}

/* Signature element: a thin route that draws itself, with a live node
   riding the path. Reused as a section-connecting motif. */
function GaitTrack({ variant = "band" }) {
  return (
    <div className={`gait gait-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path
          className="gait-path"
          d="M0 60 L280 60 C340 60 340 22 400 22 L560 22 C610 22 610 54 660 54 L860 54 C910 54 910 20 960 20 L1200 20"
          fill="none"
        />
        <path
          className="gait-path gait-path-draw"
          d="M0 60 L280 60 C340 60 340 22 400 22 L560 22 C610 22 610 54 660 54 L860 54 C910 54 910 20 960 20 L1200 20"
          fill="none"
        />
        <circle className="gait-node" r="5">
          <animateMotion
            dur="7s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="linear"
            path="M0 60 L280 60 C340 60 340 22 400 22 L560 22 C610 22 610 54 660 54 L860 54 C910 54 910 20 960 20 L1200 20"
          />
        </circle>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Chrome — loader, cursor, header
 * ------------------------------------------------------------------ */

function loaderSeen() {
  try {
    return window.sessionStorage.getItem("sleipnir-loader-seen") === "1";
  } catch {
    return false;
  }
}

function Loader() {
  const [count, setCount] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [seen] = useState(loaderSeen);

  useEffect(() => {
    if (seen) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setCount(100);
      window.setTimeout(() => {
        setHidden(true);
        try {
          window.sessionStorage.setItem("sleipnir-loader-seen", "1");
        } catch {
          /* storage unavailable — loader just replays next visit */
        }
      }, 350);
    };
    // Progress is gated by what actually blocks first paint: fonts + hero image.
    const heroImg = new Image();
    heroImg.src = "/robots/robot-hero.webp";
    Promise.allSettled([
      document.fonts?.ready ?? Promise.resolve(),
      heroImg.decode ? heroImg.decode() : Promise.resolve(),
    ]).then(finish);
    const cap = window.setTimeout(finish, 800);
    const tick = window.setInterval(
      () => setCount((value) => (done ? 100 : Math.min(92, value + 6))),
      40
    );
    return () => {
      window.clearTimeout(cap);
      window.clearInterval(tick);
    };
  }, [seen]);

  if (seen) return null;

  return (
    <div className={`loader ${hidden ? "loader-hidden" : ""}`} aria-hidden={hidden}>
      <div className="loader-mark">
        <span className="brand-ring" />
        <span className="brand-core" />
      </div>
      <div className="loader-word">SLEIPNIR</div>
      <div className="loader-bar">
        <span style={{ transform: `scaleX(${count / 100})` }} />
      </div>
      <div className="loader-meta">
        <span>booting fleet</span>
        <span>{count}%</span>
      </div>
    </div>
  );
}

function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.4 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onMove = (event) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const el = event.target;
      setActive(Boolean(el?.closest?.("a, button, .hotspot, .fleet-card")));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <motion.div
      className={`cursor ${active ? "cursor-active" : ""}`}
      aria-hidden="true"
      style={{ x: springX, y: springY }}
    />
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="brand-ring" />
      <span className="brand-core" />
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onNav = (id) => {
    setOpen(false);
    window.setTimeout(() => scrollToId(id), 100);
  };

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : "on-dark"} ${open ? "is-open" : ""}`}>
      <button className="brand" type="button" onClick={() => scrollToId("top")}>
        <BrandMark />
        <span className="brand-text">Sleipnir</span>
      </button>

      <nav className="desktop-nav" aria-label="Primary">
        {navItems.map(([label, id]) => (
          <button key={id} type="button" onClick={() => onNav(id)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <button className="cta-ghost" type="button" onClick={() => onNav("contact")}>
          Book a pilot
        </button>
      </div>

      <button
        className="burger-button"
        type="button"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>

      <div className="mobile-menu">
        {navItems.map(([label, id]) => (
          <button key={id} type="button" onClick={() => onNav(id)}>
            {label}
          </button>
        ))}
        <button className="cta-solid" type="button" onClick={() => onNav("contact")}>
          Book a pilot
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const robotY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  // Only start dimming once the robot is actually leaving the viewport.
  const robotOpacity = useTransform(scrollYProgress, [0.5, 1], [1, 0.4]);

  return (
    <section id="top" className="section hero" ref={ref}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-inner">
        <Reveal as="div" className="hero-eyebrow" variant="scale">
          <span className="pulse-dot" /> Delivery-as-a-Service
          <span className="eyebrow-ext"> · proven in simulation</span>
        </Reveal>

        <h1 className="hero-title">
          {["The courier", null].map((_, li) => (
            <span className="line-mask" key={li}>
              <motion.span
                className="line"
                initial={{ y: "115%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.35 + li * 0.14, duration: 1, ease: easeOutExpo }}
              >
                {li === 0 ? (
                  "The courier"
                ) : (
                  <>
                    that never <em>stumbles</em>
                  </>
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <Reveal as="p" className="hero-lede" delay={0.15} y={20}>
          Sleipnir runs last-mile delivery end to end inside gated communities — it picks the
          robot, routes around blockages, and explains every decision.
        </Reveal>

        <Reveal as="div" className="hero-actions" delay={0.28} y={20}>
          <button className="cta-solid" type="button" onClick={() => scrollToId("flow")}>
            See how it works
          </button>
          <button className="cta-line" type="button" onClick={() => scrollToId("fleet")}>
            Meet the fleet
          </button>
        </Reveal>

        <motion.div className="hero-figure" style={{ y: robotY, opacity: robotOpacity }}>
          <motion.img
            src="/robots/robot-hero.webp"
            width={1448}
            height={1086}
            fetchPriority="high"
            alt="Sleipnir delivery robot — a compact four-wheeled courier with a stereo camera face and a sealed cargo bay"
            className="hero-robot"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: [0, -14, 0], scale: 1 }}
            transition={{
              opacity: { duration: 1, ease: "easeOut", delay: 0.3 },
              scale: { duration: 1, ease: "easeOut", delay: 0.3 },
              y: { duration: 6, ease: "easeInOut", repeat: Infinity, delay: 1.3 },
            }}
          />
          <div className="hero-shadow" aria-hidden="true" />
          <motion.div
            className="telemetry-chip chip-a"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            <span className="chip-label">STATUS</span>
            <span className="chip-value">
              <span className="pulse-dot" /> On route · ETA 4:12
            </span>
          </motion.div>
          <motion.div
            className="telemetry-chip chip-b"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.15, duration: 0.7 }}
          >
            <span className="chip-label">BATTERY</span>
            <span className="chip-value">91%</span>
          </motion.div>
        </motion.div>
      </div>

      <button className="scroll-cue" type="button" onClick={() => scrollToId("thesis")} aria-label="Scroll down">
        <span>scroll</span>
        <span className="scroll-rail">
          <span className="scroll-dot" />
        </span>
      </button>
    </section>
  );
}

function Thesis() {
  const words = "software-led coordination + fulfilment".split(" ");
  return (
    <section id="thesis" className="section thesis">
      <div className="thesis-inner">
        <Reveal as="p" className="thesis-kicker" variant="left">
          What Sleipnir is
        </Reveal>
        <Reveal as="h2" className="thesis-copy" variant="blur" delay={0.1}>
          Not a chatbot, not a taxi. Sleipnir is the{" "}
          <span className="mark">
            {words.map((w, i) => (
              <em key={i}>{w} </em>
            ))}
          </span>
          layer for the last hundred meters — an operations brain and the robot fleet it drives,
          closer to an in-community shuttle for goods than a hail-anywhere app.
        </Reveal>
        <Reveal as="p" className="thesis-note" delay={0.2}>
          Named for Odin's eight-legged horse — the mount that crosses any terrain without
          faltering.
        </Reveal>
      </div>
      <GaitTrack variant="band" />
    </section>
  );
}

function Stats() {
  return (
    <section id="stats" className="section stats">
      <div className="stats-head">
        <Reveal as="span" className="eyebrow" variant="left">
          The beachhead
        </Reveal>
        <Reveal as="h2" className="section-title" variant="blur" delay={0.05}>
          One enclosed world.
          <br />
          <span className="muted-title">Vinhomes Ocean Park 1.</span>
        </Reveal>
        <Reveal as="p" className="stats-sub" delay={0.12}>
          High merchant and resident density over short distances — exactly where a small
          autonomous fleet beats a motorbike shipper on cost and availability.
        </Reveal>
      </div>
      <Stagger className="stats-grid" gap={0.1}>
        {stats.map(([value, label, info]) => (
          <Item className="stat" key={label} variants={itemPop}>
            <div className="stat-value">
              <CountUp value={value} />
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-info">{info}</div>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}

function Product() {
  const [active, setActive] = useState(0);
  return (
    <section id="product" className="section product">
      <div className="product-head">
        <Reveal as="span" className="eyebrow" variant="left">
          The vehicle
        </Reveal>
        <Reveal as="h2" className="section-title" variant="blur" delay={0.05}>
          Built to be trusted
          <br />
          <span className="muted-title">on a pavement full of people.</span>
        </Reveal>
      </div>

      <div className="anatomy">
        <Reveal className="anatomy-stage" variant="scale" duration={1}>
          <img
            src="/robots/robot-anatomy.webp"
            width={1437}
            height={1095}
            loading="lazy"
            decoding="async"
            alt="Sleipnir robot, three-quarter view, showing its camera face, light bar, cargo bay and four articulated wheels"
            className="anatomy-robot"
          />
          {anatomy.map(([num, title], i) => (
            <motion.button
              key={num}
              className={`hotspot ${active === i ? "is-active" : ""}`}
              style={{ left: `${anatomy[i][3]}%`, top: `${anatomy[i][4]}%` }}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.5, ease: easeOutExpo }}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              type="button"
              aria-label={title}
            >
              <span className="hotspot-ring" />
              <span className="hotspot-num">{num}</span>
            </motion.button>
          ))}
        </Reveal>

        {/* Mobile-only: feedback next to the image, where the tap happened. */}
        <motion.div
          className="anatomy-active"
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOutExpo }}
          aria-live="polite"
        >
          <span className="anatomy-num">{anatomy[active][0]}</span>
          <span className="anatomy-text">
            <strong>{anatomy[active][1]}</strong>
            <span>{anatomy[active][2]}</span>
          </span>
        </motion.div>

        <Stagger className="anatomy-list" gap={0.08} delay={0.15}>
          {anatomy.map(([num, title, body], i) => (
            <Item
              as="button"
              key={num}
              variants={itemRight}
              className={`anatomy-item ${active === i ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              type="button"
            >
              <span className="anatomy-num">{num}</span>
              <span className="anatomy-text">
                <strong>{title}</strong>
                <span>{body}</span>
              </span>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function Flow() {
  return (
    <section id="flow" className="section flow">
      <div className="flow-head">
        <Reveal as="span" className="eyebrow" variant="left">
          How it works
        </Reveal>
        <Reveal as="h2" className="section-title" variant="blur" delay={0.05}>
          One order, five calm steps
        </Reveal>
        <Reveal as="p" className="flow-sub" delay={0.1}>
          The whole pilot is a six-minute story: order, dispatch, handoff, a reroute mid-run, and a
          code at the door. Every decision is testable — and explained.
        </Reveal>
      </div>

      <Stagger className="flow-track" gap={0.12}>
        <motion.div
          className="flow-line"
          aria-hidden="true"
          variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1, ease: easeOutExpo } } }}
        />
        {flow.map(([title, lead, body], i) => (
          <Item className="flow-step" key={title} variants={itemUp}>
            <div className="flow-marker">
              <span className="flow-index">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="flow-title">{title}</h3>
            <p className="flow-lead">{lead}</p>
            <p className="flow-body">{body}</p>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}

function Fleet({ onSpec }) {
  return (
    <section id="fleet" className="section fleet">
      <div className="fleet-head">
        <Reveal as="span" className="eyebrow" variant="left">
          The fleet
        </Reveal>
        <Reveal as="h2" className="section-title" variant="blur" delay={0.05}>
          Three couriers, one roster
        </Reveal>
        <Reveal as="p" className="fleet-sub" delay={0.1}>
          The dashboard, the dispatcher and the simulator all read the same roster, so everyone
          agrees on who is where.
        </Reveal>
      </div>

      <Stagger className="fleet-grid" gap={0.12}>
        {fleet.map((robot) => (
          <Item
            className="fleet-card"
            key={robot.id}
            variants={itemPop}
            whileHover={{ y: -6, transition: { duration: 0.3, ease: easeOutExpo } }}
          >
            <div className="fleet-card-top">
              <span className="fleet-id">{robot.id}</span>
              <span className={`fleet-status status-${robot.state}`}>
                <span className="status-dot" />
                {robot.status}
              </span>
            </div>
            <div className="fleet-img-wrap">
              <img
                src={robot.img}
                width={1448}
                height={1086}
                loading="lazy"
                decoding="async"
                alt={`Sleipnir ${robot.name}`}
                className="fleet-img"
              />
            </div>
            <h3 className="fleet-name">{robot.name}</h3>
            <div className="fleet-home">
              <span>Home</span>
              {robot.home}
            </div>
            <div className="fleet-battery">
              <div className="battery-head">
                <span>Battery</span>
                <span>{robot.battery}%</span>
              </div>
              <div className="battery-track">
                <span style={{ width: `${robot.battery}%` }} />
              </div>
            </div>
            <p className="fleet-note">{robot.note}</p>
          </Item>
        ))}
      </Stagger>

      <Reveal className="fleet-foot" variant="scale" delay={0.1}>
        <button className="cta-line dark" type="button" onClick={onSpec}>
          Read the full specification
        </button>
      </Reveal>
    </section>
  );
}

// Illustrative geofence + street grid for the map panel (viewBox 0–100).
const fenceD = "M 12 26 L 36 10 L 70 8 L 91 22 L 93 56 L 76 88 L 42 93 L 13 76 Z";
const streetsD = [
  "M 18 38 L 84 34",
  "M 20 58 L 88 54",
  "M 26 76 L 74 80",
  "M 30 14 L 33 88",
  "M 52 10 L 49 91",
  "M 71 12 L 74 84",
];

function Coverage() {
  const [openPin, setOpenPin] = useState(null);
  return (
    <section id="coverage" className="section coverage">
      <div className="coverage-inner">
        <div className="coverage-copy">
          <Reveal as="span" className="eyebrow" variant="left">
            Coverage
          </Reveal>
          <Reveal as="h2" className="section-title" variant="left" delay={0.05}>
            A fixed area
            <br />
            <span className="muted-title">is a feature, not a limit.</span>
          </Reveal>
          <Reveal as="p" className="coverage-lede" variant="left" delay={0.12}>
            Private low-speed roads, no high-speed traffic, a geofenced and fully mapped area —
            a gated community is easy-mode for ground autonomy. Sleipnir maps the whole of Ocean
            Park once, then runs it every day.
          </Reveal>
          <Reveal className="coverage-legend" variant="left" delay={0.18}>
            <span className="legend-item">
              <span className="legend-swatch hot" /> Merchant density
            </span>
            <span className="legend-item">
              <span className="legend-swatch node" /> Depot / anchor
            </span>
          </Reveal>
        </div>

        <Reveal className="coverage-map" variant="scale" duration={1} delay={0.1}>
          <div className="map-frame">
            <span className="map-corner tl" />
            <span className="map-corner tr" />
            <span className="map-corner bl" />
            <span className="map-corner br" />
            <div className="map-grid" aria-hidden="true" />
            <svg className="map-fence" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <g className="map-streets">
                {streetsD.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
              <path className="fence-dash" d={fenceD} />
              {/* Solid trace draws the fence once, then settles so the
                  dashed boundary underneath stays the resting state. */}
              <motion.path
                className="fence-draw"
                d={fenceD}
                initial={{ pathLength: 0, opacity: 0.85 }}
                whileInView={{ pathLength: 1, opacity: [0.85, 0.85, 0.3] }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  pathLength: { duration: 2.2, ease: "easeInOut", delay: 0.4 },
                  opacity: { duration: 3.4, delay: 0.4, times: [0, 0.75, 1] },
                }}
              />
            </svg>
            <svg className="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M26 30 L48 50 L62 38 M48 50 L30 64 M48 50 L70 70" />
            </svg>
            <Stagger className="map-pins-layer" delay={0.6} gap={0.13}>
              {coveragePins.map(([label, sub, x, y, kind]) => (
                <Item
                  as="button"
                  type="button"
                  variants={itemFade}
                  className={`map-pin pin-${kind} ${openPin === label ? "is-open" : ""}`}
                  key={label}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => setOpenPin((current) => (current === label ? null : label))}
                  aria-label={`${label} — ${sub}`}
                >
                  <span className="pin-ring" />
                  <span className="pin-core" />
                  <span className="pin-label">
                    <strong>{label}</strong>
                    <em>{sub}</em>
                  </span>
                </Item>
              ))}
            </Stagger>
            <div className="map-readout">
              <span>20.996° N</span>
              <span>105.944° E</span>
              <span>OCEAN PARK 1</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Insights() {
  return (
    <section className="section insights">
      <Reveal as="h2" className="section-title insights-title" variant="left">
        Field notes
      </Reveal>
      <Stagger className="insights-row" gap={0.1}>
        {insights.map(([title, tag, badge]) => (
          <Item as="article" className="insight-card" key={title} variants={itemUp}>
            <div className="insight-tag">{tag}</div>
            <h3>{title}</h3>
            <span className="insight-badge">{badge}</span>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section id="contact" className="section contact">
      <div className="contact-inner">
        <div className="contact-copy">
          <img
            src="/robots/robot-top.webp"
            width={1448}
            height={1086}
            loading="lazy"
            decoding="async"
            alt=""
            className="contact-robot"
            aria-hidden="true"
          />
          <Reveal as="span" className="eyebrow light" variant="left">
            Book a pilot
          </Reveal>
          <Reveal as="h2" className="contact-title" variant="left" delay={0.05}>
            Bring steadier
            <br />
            delivery to your
            <br />
            <em>community.</em>
          </Reveal>
          <Reveal as="p" className="contact-lede" variant="left" delay={0.12}>
            We work with management boards and on-site merchants to run a delivery pilot inside one
            enclosed space. Tell us about yours.
          </Reveal>
        </div>

        <Reveal className="contact-form-wrap" variant="scale" delay={0.12}>
          {submitted ? (
            <div className="contact-thanks">
              <span className="pulse-dot" />
              <strong>Request received.</strong>
              <p>This is a demo form — no message was actually sent. We'll wire it up before launch.</p>
            </div>
          ) : (
            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <label>
                <span>Your name</span>
                <input type="text" required placeholder="Jane Nguyen" />
              </label>
              <label>
                <span>Work email</span>
                <input type="email" required placeholder="jane@community.example" />
              </label>
              <label>
                <span>Community or shop</span>
                <input type="text" placeholder="Ocean Park — Sao Biển" />
              </label>
              <label>
                <span>What would you deliver?</span>
                <textarea rows={3} placeholder="Groceries from the WinMart at each tower base…" />
              </label>
              <button className="cta-solid full" type="submit">
                Request a pilot
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Finale — the closing typographic statement. Per-letter masked
 * reveal, one italic lime accent, one outline line, then a specimen
 * row crediting the three typefaces. Designed to screenshot well.
 * ------------------------------------------------------------------ */

const typeCredits = [
  ["Ag", "Space Grotesk", "Display · 500–700", "grotesk"],
  ["Ag", "Inter", "Text · 400–600", "inter"],
  ["07", "Space Mono", "Data · 400", "mono"],
];

function FinaleLine({ text, className = "", delay = 0 }) {
  return (
    <span className={`finale-row ${className}`}>
      <span className="finale-mask">
        {text.split("").map((ch, i) => (
          <motion.span
            className="finale-ch"
            key={i}
            variants={{
              hidden: { y: "115%" },
              show: {
                y: 0,
                transition: { duration: 0.9, ease: easeOutExpo, delay: delay + i * 0.03 },
              },
            }}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        ))}
      </span>
    </span>
  );
}

function Finale() {
  return (
    <section className="finale" aria-label="Eight legs, zero stumbles">
      <div className="finale-meta">
        <span>
          <span className="pulse-dot" /> Fleet online — R-01 · R-02 · R-03
        </span>
        <span className="finale-meta-mid">Odin's eight-legged horse</span>
        <span>20.99° N — 105.94° E</span>
      </div>

      <motion.div
        className="finale-figure"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-14%" }}
        transition={{ duration: 1.4, ease: easeOutExpo, delay: 0.5 }}
      >
        <span className="figure-orbit" />
        <motion.img
          src="/robots/robot-side.webp"
          width={1448}
          height={1086}
          loading="lazy"
          decoding="async"
          alt=""
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
        />
        <span className="figure-tag">Fig. 08 — the mount</span>
      </motion.div>

      <motion.h2
        className="finale-lockup"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-14%" }}
      >
        <span className="sr-only">Eight legs, zero stumbles.</span>
        <FinaleLine text="Eight legs," className="is-solid" />
        <FinaleLine text="zero" className="is-accent" delay={0.22} />
        <FinaleLine text="stumbles." className="is-outline" delay={0.38} />
      </motion.h2>

      <Stagger className="finale-credits" gap={0.1}>
        {typeCredits.map(([glyph, name, role, face], i) => (
          <Item className="credit" key={name} variants={itemUp}>
            <span className={`credit-glyph glyph-${face}`}>{glyph}</span>
            <span className="credit-text">
              <strong>{name}</strong>
              <span>{role}</span>
            </span>
            <span className="credit-index">{String(i + 1).padStart(2, "0")}</span>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}

/* Giant wordmark that wipes from outline to gradient fill on arrival. */
function FooterWord() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <div className={`footer-word ${inView ? "is-filled" : ""}`} ref={ref} aria-hidden="true">
      <span className="fw-layer fw-outline">Sleipnir</span>
      <span className="fw-layer fw-fill">Sleipnir</span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <BrandMark />
          <span className="brand-text">Sleipnir</span>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          {navItems.map(([label, id]) => (
            <button key={id} type="button" onClick={() => scrollToId(id)}>
              {label}
            </button>
          ))}
        </nav>
      </div>
      <FooterWord />
      <GaitTrack variant="footer" />
      <div className="footer-bottom">
        <span>The courier that never stumbles.</span>
        <div className="footer-links">
          <a href="/privacy">Privacy</a>
          <a href="mailto:hello@sleipnir.example">hello@sleipnir.example</a>
        </div>
      </div>
    </footer>
  );
}

function Modal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Full specification">
      <button className="modal-backdrop" type="button" aria-label="Close" onClick={onClose} />
      <aside className="modal-panel">
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          <span />
          <span />
        </button>
        <div className="modal-head">
          <span className="eyebrow">Specification</span>
          <h2>Sleipnir courier</h2>
          <p>
            What's confirmed today, and what awaits the hardware pilot. The robot is proven in
            simulation first; physical figures are set during Phase D.
          </p>
        </div>
        <div className="spec-groups">
          {specGroups.map(([group, rows]) => (
            <div className="spec-group" key={group}>
              <h3>{group}</h3>
              {rows.map(([label, value, tbd]) => (
                <div className={`spec-line ${tbd ? "is-tbd" : ""}`} key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="spec-foot">
          TBD = pending hardware pilot. In the current program the robots are simulated and orders
          are demo orders by design.
        </p>
      </aside>
    </div>
  );
}

function PrivacyPage() {
  return (
    <main className="privacy-page">
      <Header />
      <section className="section privacy-content">
        <h1 className="privacy-title">
          Privacy
          <br />
          <span className="muted-title">policy</span>
        </h1>
        <div className="privacy-copy">
          <p>
            This is a placeholder privacy page so the footer navigation stays functional. Replace it
            with your legal copy before production.
          </p>
          <p>
            The demo does not collect personal data. Any form on this site is illustrative — nothing
            is stored or sent.
          </p>
          <button className="cta-line dark" type="button" onClick={() => (window.location.href = "/")}>
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [specOpen, setSpecOpen] = useState(false);
  const isPrivacy = window.location.pathname.includes("privacy");

  useEffect(() => {
    document.body.classList.toggle("modal-open", specOpen);
    return () => document.body.classList.remove("modal-open");
  }, [specOpen]);

  if (isPrivacy)
    return (
      <MotionConfig reducedMotion="user">
        <PrivacyPage />
      </MotionConfig>
    );

  return (
    <MotionConfig reducedMotion="user">
      <div className="grain" aria-hidden="true" />
      <Loader />
      <Cursor />
      <Header />
      <SectionNav />
      <main>
        <Hero />
        <Thesis />
        <Stats />
        <Marquee />
        <Product />
        <Flow />
        <Fleet onSpec={() => setSpecOpen(true)} />
        <Coverage />
        <Insights />
        <Contact />
        <Finale />
      </main>
      <Footer />
      <Modal open={specOpen} onClose={() => setSpecOpen(false)} />
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")).render(<App />);
