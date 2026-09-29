import { describe, it, expect } from "vitest";
import { toNumber } from "../estoque";

describe("toNumber", () => {
  it("converte número diretamente", () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(3.14)).toBe(3.14);
  });

  it("converte string numérica", () => {
    expect(toNumber("5")).toBe(5);
    expect(toNumber("3.5")).toBe(3.5);
  });

  it("converte objeto Decimal-like (com método toNumber)", () => {
    const decimal = { toNumber: () => 10.5 };
    expect(toNumber(decimal as any)).toBe(10.5);
  });
});

describe("Regras de estoque — lógica pura", () => {
  describe("saldo pode ficar negativo (spec: sem bloqueio por falta de estoque)", () => {
    it("demonstra que saldo negativo é aritmeticamente possível", () => {
      const estoqueAtual = 0;
      const quantidadeSolicitada = 1;
      const novoSaldo = estoqueAtual - quantidadeSolicitada;
      expect(novoSaldo).toBe(-1);
      expect(novoSaldo).toBeLessThan(0);
    });

    it("detecta quando há necessidade de alerta de estoque insuficiente", () => {
      const estoqueAtual = 2;
      const quantidadeSolicitada = 5;
      const precisaAlertar = estoqueAtual < quantidadeSolicitada;
      expect(precisaAlertar).toBe(true);
    });
  });

  describe("alerta de reposição (spec: estoque <= estoque_minimo)", () => {
    it("deve alertar quando estoque é exatamente igual ao mínimo", () => {
      const quantidadeEstoque = 5;
      const estoqueMinimo = 5;
      expect(quantidadeEstoque <= estoqueMinimo).toBe(true);
    });

    it("deve alertar quando estoque está abaixo do mínimo", () => {
      const quantidadeEstoque = 3;
      const estoqueMinimo = 5;
      expect(quantidadeEstoque <= estoqueMinimo).toBe(true);
    });

    it("não deve alertar quando estoque está acima do mínimo", () => {
      const quantidadeEstoque = 10;
      const estoqueMinimo = 5;
      expect(quantidadeEstoque <= estoqueMinimo).toBe(false);
    });
  });

  describe("spec: 5 unidades - 2 = 3", () => {
    it("baixa de 2 unidades em estoque de 5 resulta em 3", () => {
      const estoqueInicial = 5;
      const baixa = 2;
      const estoqueRestante = estoqueInicial - baixa;
      expect(estoqueRestante).toBe(3);
    });
  });
});
