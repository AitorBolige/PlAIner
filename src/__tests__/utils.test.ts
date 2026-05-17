import { describe, it, expect } from "vitest";
import { budgetZone, monthAbbr } from "@/lib/data";

// ─── TEST 1: budgetZone ───────────────────────────────────────────────────────
// budgetZone rep un número (pressupost en €) i retorna una etiqueta.
// Comprovem que cada rang de pressupost dona l'etiqueta correcta.
describe("budgetZone", () => {
  it("retorna Econòmic per a pressupostos baixos (< 600€)", () => {
    expect(budgetZone(200).label).toBe("Econòmic");
    expect(budgetZone(599).label).toBe("Econòmic");
  });

  it("retorna Equilibrat per a pressupostos mitjans (600–1499€)", () => {
    expect(budgetZone(600).label).toBe("Equilibrat");
    expect(budgetZone(1000).label).toBe("Equilibrat");
  });

  it("retorna Confortable per a pressupostos alts (1500–2999€)", () => {
    expect(budgetZone(1500).label).toBe("Confortable");
    expect(budgetZone(2500).label).toBe("Confortable");
  });

  it("retorna Premium per a pressupostos molt alts (≥ 3000€)", () => {
    expect(budgetZone(3000).label).toBe("Premium");
    expect(budgetZone(9999).label).toBe("Premium");
  });
});

// ─── TEST 2: monthAbbr ───────────────────────────────────────────────────────
// monthAbbr rep una data i retorna l'abreviació del mes en català.
// Comprovem que gener és "gen", juliol és "jul", etc.
describe("monthAbbr", () => {
  it("retorna gen per al mes de gener", () => {
    expect(monthAbbr(new Date("2025-01-15"))).toBe("gen");
  });

  it("retorna jul per al mes de juliol", () => {
    expect(monthAbbr(new Date("2025-07-04"))).toBe("jul");
  });

  it("retorna des per al mes de desembre", () => {
    expect(monthAbbr(new Date("2025-12-25"))).toBe("des");
  });
});

// ─── TEST 3: validació de password ───────────────────────────────────────────
// Comprovem la regla de negoci: la contrasenya ha de tenir mínim 8 caràcters.
// Aquesta és la mateixa validació que fa l'API de registre.
function isPasswordValid(password: string): boolean {
  return password.length >= 8;
}

describe("validació de contrasenya", () => {
  it("rebutja contrasenyes de menys de 8 caràcters", () => {
    expect(isPasswordValid("1234567")).toBe(false);
    expect(isPasswordValid("abc")).toBe(false);
  });

  it("accepta contrasenyes de 8 o més caràcters", () => {
    expect(isPasswordValid("12345678")).toBe(true);
    expect(isPasswordValid("contrasenya_segura")).toBe(true);
  });
});

// ─── TEST 4: validació d'email ────────────────────────────────────────────────
// Comprovem que un email té el format correcte (conté @ i un domini).
// Útil per validar inputs abans d'enviar al servidor.
function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe("validació d'email", () => {
  it("rebutja emails sense @", () => {
    expect(isEmailValid("noesunemail")).toBe(false);
    expect(isEmailValid("faltelarroba.com")).toBe(false);
  });

  it("rebutja emails sense domini", () => {
    expect(isEmailValid("usuari@")).toBe(false);
  });

  it("accepta emails vàlids", () => {
    expect(isEmailValid("aitor@upf.edu")).toBe(true);
    expect(isEmailValid("test@gmail.com")).toBe(true);
  });
});
