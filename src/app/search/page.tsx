"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  Bus,
  Calendar,
  Car,
  Check,
  ChevronRight,
  Map,
  MapPin,
  Minus,
  Plane,
  Plus,
  Search,
  Sparkles,
  Train,
  Users,
  Wallet,
  X,
} from "lucide-react";

import {
  budgetZone,
  DESTINATIONS,
  DEST_CATEGORIES,
  monthAbbr,
  TRANSPORT,
  type Destination,
  type Transport,
} from "@/lib/data";

type DatesValue = { start: Date; end: Date; days: number };

function useAppShellBody() {
  React.useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);
}

function HeroImg({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}

function IconSquare({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 12px",
        borderRadius: 9999,
        background: "rgba(255,255,255,0.72)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-muted)",
      }}
    >
      <Check size={14} style={{ color: "var(--green)" }} />
      {children}
    </span>
  );
}

function Sheet({
  open,
  onClose,
  title,
  height = "82%",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  height?: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="pl-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        className="pl-sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 101,
          height,
          background: "#fff",
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          boxShadow: "0 -18px 50px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        {(title ?? null) && (
          <div
            style={{
              padding: "14px 20px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              className="display"
              style={{
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
            <button
              onClick={onClose}
              className="pl-tap"
              style={{
                width: 34,
                height: 34,
                borderRadius: 9999,
                background: "var(--surface-2)",
                border: "none",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}

function BottomTabs({ active }: { active: "search" | "trips" }) {
  const Tab = ({
    id,
    icon,
    label,
    href,
  }: {
    id: "search" | "trips";
    icon: React.ReactNode;
    label: string;
    href: string;
  }) => {
    const isActive = id === active;
    return (
      <Link
        href={href}
        className="pl-tap"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          color: isActive ? "var(--green)" : "var(--text-faint)",
          padding: "8px 0",
          textDecoration: "none",
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 11,
            fontWeight: isActive ? 600 : 500,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: 9999,
            background: isActive ? "var(--green)" : "transparent",
            marginTop: 1,
          }}
        />
      </Link>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 78,
        paddingBottom: 14,
        background: "rgba(247,245,242,0.92)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <Tab
        id="search"
        icon={<Search size={22} />}
        label="Cerca"
        href="/search"
      />
      <Tab id="trips" icon={<Map size={22} />} label="Viatges" href="/trips" />
    </div>
  );
}

function Row({
  first,
  icon,
  iconBg,
  iconColor,
  label,
  value,
  placeholder,
  sub,
  badge,
  valueIcon,
  onClick,
  noBorder,
}: {
  first?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string | null;
  placeholder: string;
  sub?: string | null;
  badge?: string | null;
  valueIcon?: React.ReactNode | null;
  onClick: () => void;
  noBorder?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="pl-tap"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        minHeight: 64,
        textAlign: "left",
        border: "none",
        borderTop: first
          ? "none"
          : noBorder
            ? "none"
            : "1px solid var(--border)",
        background: "#fff",
      }}
    >
      <IconSquare color={iconColor} bg={iconBg}>
        {icon}
      </IconSquare>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="micro">{label}</div>
        <div
          style={{
            marginTop: 2,
            fontSize: 15,
            fontWeight: value ? 600 : 400,
            fontFamily: value ? "var(--font-display)" : "var(--font-body)",
            color: value ? "var(--text)" : "var(--text-faint)",
            letterSpacing: value ? "-0.01em" : 0,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {valueIcon}
          <span
            style={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value || placeholder}
          </span>
          {badge && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 9999,
                background: "var(--green-subtle)",
                color: "var(--green-deep)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {sub && (
          <div
            style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 1 }}
          >
            {sub}
          </div>
        )}
      </div>
      <ChevronRight size={18} style={{ color: "var(--text-faint)" }} />
    </button>
  );
}

function CircBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="pl-tap"
      style={{
        width: 32,
        height: 32,
        borderRadius: 9999,
        border: "1.5px solid var(--border-md)",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: disabled ? "var(--text-faint)" : "var(--text)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function DestCard({
  dest,
  height,
  onClick,
}: {
  dest: Destination;
  height: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const tagBg =
    dest.tagColor === "gold"
      ? "rgba(200,134,10,0.92)"
      : dest.tagColor === "blue"
        ? "rgba(59,135,232,0.92)"
        : "rgba(13,158,122,0.92)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="pl-tap"
      style={{
        position: "relative",
        height,
        borderRadius: 20,
        overflow: "hidden",
        background: "#1a1a1a",
        textAlign: "left",
        border: "none",
        width: "100%",
        boxShadow: hovered
          ? "0 16px 48px rgba(0,0,0,0.3)"
          : "0 4px 16px rgba(0,0,0,0.12)",
        transform: hovered ? "scale(1.012) translateY(-1px)" : "scale(1)",
        transition: "box-shadow 280ms var(--ease), transform 280ms var(--ease)",
        display: "block",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: hovered ? "scale(1.06)" : "scale(1)",
          transition: "transform 500ms var(--ease)",
        }}
      >
        <HeroImg src={dest.img} alt={dest.city} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.78) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "3px 8px",
          borderRadius: 9999,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 10.5,
          color: "#fff",
          whiteSpace: "nowrap",
          letterSpacing: "-0.005em",
        }}
      >
        des de {dest.from}€
      </div>
      <div style={{ position: "absolute", left: 12, bottom: 12, right: 12 }}>
        <div
          className="display"
          style={{
            fontWeight: 800,
            fontSize: 18,
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            textShadow: "0 1px 8px rgba(0,0,0,0.5)",
            marginBottom: 4,
          }}
        >
          {dest.city}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.65)",
              fontWeight: 500,
            }}
          >
            {dest.country}
          </span>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              padding: "2px 7px",
              borderRadius: 9999,
              background: tagBg,
              color: "#fff",
            }}
          >
            {dest.tag}
          </span>
        </div>
      </div>
    </button>
  );
}

function DestinationSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (d: Destination) => void;
}) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setCat("all");
      return;
    }
    const t = window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      320,
    );
    return () => window.clearTimeout(t);
  }, [open]);

  const bySearch = q
    ? DESTINATIONS.filter(
        (d) =>
          d.city.toLowerCase().includes(q.toLowerCase()) ||
          d.country.toLowerCase().includes(q.toLowerCase()),
      )
    : null;

  const byCat =
    cat === "all"
      ? DESTINATIONS
      : DESTINATIONS.filter((d) => d.cats && d.cats.includes(cat));
  const featured = byCat[0];
  const grid = byCat.slice(1);

  const catIcon = (id: string, active: boolean) => {
    const color = active ? "#fff" : "var(--text-muted)";
    const common = { width: 16, height: 16, color };
    if (id === "city") return <MapPin {...common} />;
    if (id === "culture") return <Sparkles {...common} />;
    if (id === "adventure") return <Map {...common} />;
    if (id === "beach") return <MapPin {...common} />;
    return <Map {...common} />;
  };

  return (
    <Sheet open={open} onClose={onClose} height="92%">
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#fff",
          padding: "12px 20px 14px",
          boxShadow: "0 1px 0 var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              className="micro"
              style={{
                color: "var(--green)",
                letterSpacing: "0.1em",
                marginBottom: 3,
              }}
            >
              ON VOLS ANAR?
            </div>
            <div
              className="display"
              style={{
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              Tria la destinació
            </div>
          </div>
          <button
            onClick={onClose}
            className="pl-tap"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              background: "var(--surface-2)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 46,
            padding: "0 14px",
            background: "var(--surface-2)",
            borderRadius: 12,
            border: "1.5px solid var(--border)",
          }}
        >
          <Search
            size={17}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Barcelona, Tòquio, Dubai..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14.5,
              color: "var(--text)",
            }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="pl-tap"
              style={{
                width: 20,
                height: 20,
                borderRadius: 9999,
                background: "var(--surface-3)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {!q && (
          <div
            className="pl-noscroll"
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              marginTop: 12,
              paddingBottom: 1,
            }}
          >
            {DEST_CATEGORIES.map((c) => {
              const active = c.id === cat;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className="pl-tap"
                  style={{
                    flexShrink: 0,
                    height: 34,
                    padding: "0 12px 0 10px",
                    borderRadius: 9999,
                    border: `1.5px solid ${active ? "var(--green)" : "var(--border)"}`,
                    background: active ? "var(--green)" : "#fff",
                    color: active ? "#fff" : "var(--text-muted)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 200ms var(--ease)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {catIcon(c.id, active)}
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="pl-noscroll"
        style={{ overflowY: "auto", flex: 1, paddingBottom: 32 }}
      >
        {bySearch ? (
          <div style={{ padding: "6px 16px 0" }}>
            {bySearch.length === 0 ? (
              <div
                style={{
                  padding: "52px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 9999,
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Search size={26} style={{ color: "var(--text-faint)" }} />
                </div>
                <div
                  className="display"
                  style={{
                    fontWeight: 700,
                    fontSize: 17,
                    color: "var(--text-muted)",
                  }}
                >
                  Sense resultats
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-faint)" }}>
                  Prova amb &quot;{q.slice(0, 1).toUpperCase() + q.slice(1)}
                  &quot;
                </div>
              </div>
            ) : (
              bySearch.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelect(d);
                    onClose();
                  }}
                  className="pl-tap"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    width: "100%",
                    padding: "11px 2px",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    borderBottom:
                      i < bySearch.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      overflow: "hidden",
                      flexShrink: 0,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
                    }}
                  >
                    <HeroImg src={d.img} alt={d.city} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="display"
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: "-0.02em",
                        color: "var(--text)",
                      }}
                    >
                      {d.city}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {d.country} · {d.hours}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      className="display"
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        color: "var(--text)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      des de {d.from}€
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-faint)",
                        marginTop: 2,
                      }}
                    >
                      {d.temp} · {d.tag}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div style={{ padding: "18px 16px 0" }}>
            {!featured ? null : (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      className="micro"
                      style={{ color: "var(--green)", letterSpacing: "0.08em" }}
                    >
                      RECOMANAT PER A TU
                    </div>
                    <span
                      style={{ fontSize: 11.5, color: "var(--text-faint)" }}
                    >
                      {byCat.length} destins
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelect(featured);
                      onClose();
                    }}
                    className="pl-tap"
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 210,
                      borderRadius: 24,
                      overflow: "hidden",
                      background: "#0a0a0a",
                      border: "none",
                      display: "block",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
                    }}
                  >
                    <HeroImg src={featured.img} alt={featured.city} />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        right: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "var(--green)",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.07em",
                          padding: "5px 11px",
                          borderRadius: 9999,
                          textTransform: "uppercase",
                        }}
                      >
                        <Sparkles size={12} />
                        Tendència
                      </div>
                      <div
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          border: "1px solid rgba(255,255,255,0.18)",
                          color: "#fff",
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "5px 11px",
                          borderRadius: 9999,
                          fontFamily: "var(--font-display)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        des de {featured.from}€
                      </div>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 16,
                        bottom: 16,
                        right: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            className="display"
                            style={{
                              fontWeight: 800,
                              fontSize: 28,
                              color: "#fff",
                              letterSpacing: "-0.04em",
                              lineHeight: 1,
                              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                            }}
                          >
                            {featured.city}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 5,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12.5,
                                color: "rgba(255,255,255,0.78)",
                                fontWeight: 500,
                              }}
                            >
                              {featured.country}
                            </span>
                            <span
                              style={{
                                width: 3,
                                height: 3,
                                borderRadius: 9999,
                                background: "rgba(255,255,255,0.35)",
                                display: "inline-block",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.65)",
                              }}
                            >
                              {featured.temp}
                            </span>
                            <span
                              style={{
                                width: 3,
                                height: 3,
                                borderRadius: 9999,
                                background: "rgba(255,255,255,0.35)",
                                display: "inline-block",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.65)",
                              }}
                            >
                              {featured.hours}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9999,
                            background: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ArrowRight size={16} style={{ color: "#fff" }} />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {grid.length > 0 && (
                  <>
                    <div
                      className="micro"
                      style={{
                        color: "var(--text-muted)",
                        margin: "18px 2px 12px",
                        letterSpacing: "0.08em",
                      }}
                    >
                      MÉS DESTINS
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      {grid.map((d) => {
                        const tagBg =
                          d.tagColor === "gold"
                            ? "rgba(200,134,10,0.92)"
                            : d.tagColor === "blue"
                              ? "rgba(59,135,232,0.92)"
                              : "rgba(13,158,122,0.92)";
                        return (
                          <button
                            key={d.id}
                            onClick={() => {
                              onSelect(d);
                              onClose();
                            }}
                            className="pl-tap"
                            style={{
                              position: "relative",
                              height: 150,
                              borderRadius: 18,
                              overflow: "hidden",
                              background: "#0a0a0a",
                              border: "none",
                              display: "block",
                              width: "100%",
                              boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
                            }}
                          >
                            <HeroImg src={d.img} alt={d.city} />
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                  "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                background: "rgba(0,0,0,0.48)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                padding: "3px 8px",
                                borderRadius: 9999,
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                fontSize: 10,
                                color: "#fff",
                              }}
                            >
                              des de {d.from}€
                            </div>
                            <div
                              style={{
                                position: "absolute",
                                left: 11,
                                bottom: 11,
                                right: 11,
                              }}
                            >
                              <div
                                className="display"
                                style={{
                                  fontWeight: 800,
                                  fontSize: 16.5,
                                  color: "#fff",
                                  letterSpacing: "-0.03em",
                                  lineHeight: 1.05,
                                }}
                              >
                                {d.city}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginTop: 4,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "rgba(255,255,255,0.62)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {d.country}
                                  </span>
                                  <span
                                    style={{
                                      width: 2,
                                      height: 2,
                                      borderRadius: 9999,
                                      background: "rgba(255,255,255,0.3)",
                                      display: "inline-block",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "rgba(255,255,255,0.55)",
                                    }}
                                  >
                                    {d.temp}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: 8.5,
                                    fontWeight: 800,
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    padding: "2px 7px",
                                    borderRadius: 9999,
                                    background: tagBg,
                                    color: "#fff",
                                  }}
                                >
                                  {d.tag}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function DatesSheet({
  open,
  onClose,
  onConfirm,
  value,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (v: DatesValue) => void;
  value: DatesValue | null;
}) {
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [start, setStart] = React.useState<Date | null>(value?.start ?? null);
  const [end, setEnd] = React.useState<Date | null>(value?.end ?? null);

  React.useEffect(() => {
    if (!open) return;
    setStart(value?.start ?? null);
    setEnd(value?.end ?? null);
  }, [open, value]);

  const months = React.useMemo(() => {
    const m0 = new Date(today.getFullYear(), today.getMonth(), 1);
    const m1 = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return [m0, m1];
  }, [today]);

  const onDay = (d: Date) => {
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
      return;
    }
    if (d < start) {
      setStart(d);
      setEnd(null);
      return;
    }
    setEnd(d);
  };

  const days =
    start && end
      ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1
      : 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Quan vols viatjar?"
      height="84%"
    >
      <div
        className="pl-noscroll"
        style={{ overflowY: "auto", flex: 1, padding: "0 16px 16px" }}
      >
        {months.map((m) => (
          <Month
            key={m.toISOString()}
            month={m}
            start={start}
            end={end}
            today={today}
            onDay={onDay}
          />
        ))}
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#fff",
          padding: "12px 20px 22px",
          borderTop: "1px solid var(--border)",
        }}
      >
        {days > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--green-subtle)",
              color: "var(--green-deep)",
              padding: "6px 12px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            <Check size={14} /> {days} dies
          </div>
        )}
        <button
          disabled={!start || !end}
          onClick={() => {
            if (!start || !end) return;
            onConfirm({ start, end, days });
            onClose();
          }}
          className="pl-tap"
          style={{
            width: "100%",
            height: 52,
            borderRadius: 9999,
            background: start && end ? "var(--green)" : "var(--surface-2)",
            color: start && end ? "#fff" : "var(--text-faint)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            boxShadow: start && end ? "var(--shadow-cta)" : "none",
            cursor: start && end ? "pointer" : "not-allowed",
            border: "none",
          }}
        >
          Confirmar dates
        </button>
      </div>
    </Sheet>
  );
}

function Month({
  month,
  start,
  end,
  today,
  onDay,
}: {
  month: Date;
  start: Date | null;
  end: Date | null;
  today: Date;
  onDay: (d: Date) => void;
}) {
  const monthName = month.toLocaleDateString("ca", {
    month: "long",
    year: "numeric",
  });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++)
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  const sameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.toDateString() === b.toDateString();
  const inRange = (d: Date) => !!start && !!end && d >= start && d <= end;

  return (
    <div style={{ marginTop: 22 }}>
      <div
        className="display"
        style={{
          fontWeight: 800,
          fontSize: 16,
          padding: "0 4px 12px",
          textTransform: "capitalize",
          letterSpacing: "-0.02em",
          color: "var(--text)",
        }}
      >
        {monthName}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          fontSize: 10.5,
          color: "var(--text-faint)",
          textAlign: "center",
          padding: "0 2px 8px",
          fontWeight: 700,
          letterSpacing: "0.04em",
        }}
      >
        {["DL", "DT", "DC", "DJ", "DV", "DS", "DG"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 1,
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dd = new Date(d);
          dd.setHours(0, 0, 0, 0);
          const past = dd < today;
          const isStart = sameDay(dd, start);
          const isEnd = sameDay(dd, end);
          const ranged = inRange(dd) && !isStart && !isEnd;
          const isToday = sameDay(dd, today);
          return (
            <button
              key={i}
              disabled={past}
              onClick={() => onDay(dd)}
              className="pl-tap"
              style={{
                height: 40,
                borderRadius: isStart
                  ? "9999px 0 0 9999px"
                  : isEnd
                    ? "0 9999px 9999px 0"
                    : ranged
                      ? 0
                      : 9999,
                background:
                  isStart || isEnd
                    ? "var(--green)"
                    : ranged
                      ? "rgba(13,158,122,0.12)"
                      : "transparent",
                color: past
                  ? "var(--text-faint)"
                  : isStart || isEnd
                    ? "#fff"
                    : ranged
                      ? "var(--green-deep)"
                      : "var(--text)",
                fontSize: 14,
                fontWeight: isStart || isEnd || isToday ? 700 : 400,
                fontFamily:
                  isStart || isEnd ? "var(--font-display)" : "inherit",
                cursor: past ? "not-allowed" : "pointer",
                border:
                  isToday && !isStart && !isEnd
                    ? "1.5px solid var(--green)"
                    : "none",
                opacity: past ? 0.35 : 1,
                transition: "background 120ms",
                position: "relative",
              }}
            >
              {dd.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TransportSheet({
  open,
  onClose,
  onSelect,
  value,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (t: Transport) => void;
  value: Transport | null;
}) {
  const [picked, setPicked] = React.useState<string | null>(value?.id ?? null);
  React.useEffect(() => {
    if (!open) return;
    setPicked(value?.id ?? null);
  }, [open, value]);

  const icons: Record<string, React.ReactNode> = {
    plane: <Plane size={22} />,
    train: <Train size={22} />,
    bus: <Bus size={22} />,
    car: <Car size={22} />,
  };

  return (
    <Sheet open={open} onClose={onClose} title="Com vols anar?" height="62%">
      <div
        style={{
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {TRANSPORT.map((t) => {
          const sel = picked === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setPicked(t.id)}
              className="pl-tap"
              style={{
                position: "relative",
                padding: "14px 14px",
                minHeight: 84,
                textAlign: "left",
                borderRadius: 18,
                border: `2px solid ${sel ? "var(--green)" : "var(--border)"}`,
                background: sel ? "rgba(13,158,122,0.07)" : "#fff",
                transition: "all 180ms var(--ease)",
              }}
            >
              <div
                style={{
                  color: sel ? "var(--green)" : "var(--text)",
                  marginBottom: 8,
                }}
              >
                {icons[t.id]}
              </div>
              <div
                className="display"
                style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}
              >
                {t.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {t.sub}
              </div>
              {sel && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 22,
                    height: 22,
                    borderRadius: 9999,
                    background: "var(--green)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={14} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "4px 20px 22px" }}>
        <button
          disabled={!picked}
          onClick={() => {
            const t = TRANSPORT.find((x) => x.id === picked);
            if (!t) return;
            onSelect(t);
            onClose();
          }}
          className="pl-tap"
          style={{
            width: "100%",
            height: 52,
            borderRadius: 9999,
            background: picked ? "var(--green)" : "var(--surface-2)",
            color: picked ? "#fff" : "var(--text-faint)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            boxShadow: picked ? "var(--shadow-cta)" : "none",
            border: "none",
            cursor: picked ? "pointer" : "not-allowed",
          }}
        >
          Confirmar transport
        </button>
      </div>
    </Sheet>
  );
}

function BudgetSheet({
  open,
  onClose,
  onConfirm,
  value = 1200,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (v: number) => void;
  value?: number;
}) {
  const [v, setV] = React.useState(value);
  const [dragging, setDragging] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setV(value);
  }, [open, value]);

  const min = 200;
  const max = 5000;
  const step = 50;
  const pct = (v - min) / (max - min);

  const setFromClientX = (cx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let p = (cx - r.left) / r.width;
    p = Math.max(0, Math.min(1, p));
    let raw = min + p * (max - min);
    raw = Math.round(raw / step) * step;
    setV(raw);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const zone = budgetZone(v);
  const activeColor =
    zone.label === "Econòmic"
      ? "var(--blue)"
      : zone.label === "Equilibrat"
        ? "var(--green)"
        : zone.label === "Confortable"
          ? "var(--gold)"
          : "var(--green)";

  return (
    <Sheet open={open} onClose={onClose} title="Quin pressupost?" height="76%">
      <div style={{ padding: "12px 24px 0", textAlign: "center" }}>
        <div
          className="display"
          style={{
            fontWeight: 800,
            fontSize: 64,
            color: "var(--text)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          {v.toLocaleString("ca")}
          <span
            style={{ fontSize: 36, marginLeft: 4, letterSpacing: "-0.02em" }}
          >
            {" "}
            €
          </span>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 12.5,
            color: "var(--text-muted)",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          per persona · tot inclòs
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            padding: "5px 12px",
            borderRadius: 9999,
            background: "rgba(13,158,122,0.10)",
            border: "1px solid rgba(13,158,122,0.20)",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: activeColor,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: activeColor,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {zone.label}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            · {zone.sub}
          </span>
        </div>
      </div>

      <div style={{ padding: "28px 28px 0" }}>
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "relative",
            height: 10,
            borderRadius: 9999,
            background: "var(--surface-2)",
            cursor: "pointer",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${pct * 100}%`,
              background: "var(--green)",
              borderRadius: 9999,
              transition: dragging ? "none" : "width 80ms",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${pct * 100}%`,
              width: 30,
              height: 30,
              borderRadius: 9999,
              background: "#fff",
              border: "3px solid var(--green)",
              transform: "translate(-50%, -50%)",
              boxShadow: `0 2px 12px rgba(13,158,122,0.35), 0 0 0 ${dragging ? 5 : 0}px rgba(13,158,122,0.16)`,
              transition: dragging ? "box-shadow 100ms" : "box-shadow 200ms",
              cursor: "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: "var(--green)",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 28px 0", display: "flex", gap: 8 }}>
        {[500, 1200, 2500, 5000].map((preset) => (
          <button
            key={preset}
            onClick={() => setV(preset)}
            className="pl-tap"
            style={{
              flex: 1,
              height: 34,
              borderRadius: 9999,
              background: v === preset ? "var(--text)" : "var(--surface-2)",
              color: v === preset ? "#fff" : "var(--text-muted)",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              transition: "all 200ms var(--ease)",
            }}
          >
            {preset >= 1000 ? `${preset / 1000}k€` : `${preset}€`}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 24px 24px", marginTop: "auto" }}>
        <button
          onClick={() => {
            onConfirm(v);
            onClose();
          }}
          className="pl-tap"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 9999,
            background: "var(--green)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            boxShadow: "var(--shadow-cta)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Confirmar · {v.toLocaleString("ca")} €
        </button>
      </div>
    </Sheet>
  );
}

export default function SearchPage() {
  useAppShellBody();
  const router = useRouter();
  const { data: session } = useSession();

  const userName = session?.user?.name || "Joana";
  const initial = (userName || "J")[0]?.toUpperCase() || "J";

  const [destination, setDestination] = React.useState<Destination | null>(
    null,
  );
  const [dates, setDates] = React.useState<DatesValue | null>(null);
  const [transport, setTransport] = React.useState<Transport | null>(null);
  const [people, setPeople] = React.useState(2);
  const [budget, setBudget] = React.useState(1200);
  const [openSheet, setOpenSheet] = React.useState<
    null | "dest" | "dates" | "transport" | "budget"
  >(null);

  const ready = !!(destination && dates);
  const transportIcon =
    transport?.id === "plane" ? (
      <Plane size={16} style={{ marginRight: 6, color: "var(--coral)" }} />
    ) : transport?.id === "train" ? (
      <Train size={16} style={{ marginRight: 6, color: "var(--coral)" }} />
    ) : transport?.id === "bus" ? (
      <Bus size={16} style={{ marginRight: 6, color: "var(--coral)" }} />
    ) : transport?.id === "car" ? (
      <Car size={16} style={{ marginRight: 6, color: "var(--coral)" }} />
    ) : null;

  const fmtDates =
    dates?.start && dates?.end
      ? `${dates.start.getDate()} ${monthAbbr(dates.start)} – ${dates.end.getDate()} ${monthAbbr(dates.end)} · ${dates.days} dies`
      : null;

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <div
        className="pl-app pl-fadein"
        style={{
          width: "100%",
          maxWidth: 430,
          height: "100%",
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        <div
          className="pl-noscroll"
          style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}
        >
          <div
            style={{
              padding: "54px 20px 0",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Bon dia, {userName}
              </div>
              <div
                className="display"
                style={{
                  fontWeight: 800,
                  fontSize: 34,
                  letterSpacing: "-0.03em",
                  marginTop: 4,
                  lineHeight: 1.05,
                }}
              >
                On anem?
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  marginTop: 8,
                  marginBottom: 22,
                  maxWidth: 280,
                }}
              >
                Configura el teu viatge i deixa que la IA faci la resta.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 4,
              }}
            >
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="pl-tap"
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                }}
              >
                Sortir
              </button>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: "var(--green-subtle)",
                  color: "var(--green-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {initial}
              </div>
            </div>
          </div>

          <div
            style={{
              margin: "0 16px",
              background: "#fff",
              borderRadius: 24,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <Row
              first
              icon={<MapPin size={18} />}
              iconColor="var(--green)"
              iconBg="var(--green-subtle)"
              label="DESTINACIÓ"
              value={destination?.city ?? null}
              placeholder="Quina destinació?"
              sub={destination?.country ?? null}
              onClick={() => setOpenSheet("dest")}
            />
            <Row
              icon={<Calendar size={18} />}
              iconColor="var(--blue)"
              iconBg="var(--blue-subtle)"
              label="DATES"
              value={fmtDates}
              placeholder="Quan vols viatjar?"
              onClick={() => setOpenSheet("dates")}
            />
            <Row
              icon={<Plane size={18} />}
              iconColor="var(--coral)"
              iconBg="var(--coral-subtle)"
              label="TRANSPORT"
              value={transport?.label ?? null}
              sub={transport?.sub ?? null}
              placeholder="Com vols anar?"
              valueIcon={transportIcon}
              onClick={() => setOpenSheet("transport")}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                minHeight: 64,
                borderTop: "1px solid var(--border)",
              }}
            >
              <IconSquare color="var(--coral)" bg="var(--coral-subtle)">
                <Users size={18} />
              </IconSquare>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="micro">PERSONES</div>
                <div
                  className="display"
                  style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}
                >
                  {people} {people === 1 ? "persona" : "persones"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CircBtn
                  disabled={people <= 1}
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                >
                  <Minus size={16} />
                </CircBtn>
                <div
                  className="display"
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    minWidth: 22,
                    textAlign: "center",
                  }}
                >
                  {people}
                </div>
                <CircBtn
                  disabled={people >= 12}
                  onClick={() => setPeople((p) => Math.min(12, p + 1))}
                >
                  <Plus size={16} />
                </CircBtn>
              </div>
            </div>

            <Row
              icon={<Wallet size={18} />}
              iconColor="var(--gold)"
              iconBg="var(--gold-subtle)"
              label="PRESSUPOST PER PERSONA"
              value={`${budget.toLocaleString("ca")} € per persona`}
              placeholder="Quin pressupost?"
              badge={budgetZone(budget).label}
              onClick={() => setOpenSheet("budget")}
              noBorder
            />
          </div>

          <div style={{ padding: "16px 16px 0" }}>
            <button
              disabled={!ready}
              onClick={() => ready && router.push("/trips")}
              className="pl-tap"
              style={{
                width: "100%",
                height: 58,
                borderRadius: 9999,
                background: ready ? "var(--green)" : "var(--surface-2)",
                color: ready ? "#fff" : "var(--text-muted)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "-0.01em",
                boxShadow: ready ? "var(--shadow-cta)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: ready ? "pointer" : "not-allowed",
                transition: "all 220ms var(--ease)",
                border: "none",
              }}
            >
              <Sparkles size={18} style={{ opacity: ready ? 1 : 0.6 }} />
              {ready ? "Genera el meu viatge" : "Completa tots els camps"}
              {ready && <ArrowRight size={18} />}
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: "0 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "center",
            }}
          >
            <TrustBadge>Pressupost real</TrustBadge>
            <TrustBadge>Sense sorpreses</TrustBadge>
            <TrustBadge>Personalitzat per IA</TrustBadge>
          </div>

          <div
            style={{
              padding: "28px 20px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                className="micro"
                style={{ color: "var(--green)", letterSpacing: "0.1em" }}
              >
                DESTINS POPULARS
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  fontFamily: "var(--font-display)",
                  lineHeight: 1,
                }}
              >
                On t&apos;agradaria anar?
              </div>
            </div>
            <button
              className="pl-tap"
              style={{
                fontSize: 12.5,
                color: "var(--green)",
                fontWeight: 700,
                background: "var(--green-subtle)",
                padding: "5px 12px",
                borderRadius: 9999,
                border: "none",
              }}
            >
              Veure tots
            </button>
          </div>

          <div
            style={{
              padding: "0 16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {[
              DESTINATIONS[1],
              DESTINATIONS[3],
              DESTINATIONS[2],
              DESTINATIONS[6],
              DESTINATIONS[7],
              DESTINATIONS[4],
            ]
              .filter(Boolean)
              .map((d) => (
                <DestCard
                  key={d.id}
                  dest={d}
                  height={158}
                  onClick={() => {
                    setDestination(d);
                  }}
                />
              ))}
          </div>

          <div style={{ marginTop: 22, paddingLeft: 20 }}>
            <div
              className="micro"
              style={{ marginBottom: 12, letterSpacing: "0.1em" }}
            >
              MÉS PER EXPLORAR
            </div>
            <div
              className="pl-noscroll"
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingRight: 20,
                paddingBottom: 6,
              }}
            >
              {DESTINATIONS.slice(5, 10).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDestination(d)}
                  className="pl-tap"
                  style={{
                    position: "relative",
                    flex: "0 0 auto",
                    width: 120,
                    height: 90,
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#111",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  <HeroImg src={d.img} alt={d.city} />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(170deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.72) 100%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 9,
                      bottom: 7,
                      right: 9,
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                      textShadow: "0 1px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    {d.city}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DestinationSheet
          open={openSheet === "dest"}
          onClose={() => setOpenSheet(null)}
          onSelect={(d) => {
            setDestination(d);
          }}
        />
        <DatesSheet
          open={openSheet === "dates"}
          onClose={() => setOpenSheet(null)}
          value={dates}
          onConfirm={(v) => setDates(v)}
        />
        <TransportSheet
          open={openSheet === "transport"}
          onClose={() => setOpenSheet(null)}
          value={transport}
          onSelect={(t) => setTransport(t)}
        />
        <BudgetSheet
          open={openSheet === "budget"}
          onClose={() => setOpenSheet(null)}
          value={budget}
          onConfirm={(v) => setBudget(v)}
        />

        <BottomTabs active="search" />
      </div>
    </div>
  );
}
