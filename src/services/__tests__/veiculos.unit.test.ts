import { describe, it, expect } from "vitest";
import { validarPlaca } from "../veiculos";

describe("validarPlaca", () => {
  describe("padrão antigo (ABC1234)", () => {
    it("aceita placa válida sem hífen", () => {
      const resultado = validarPlaca("ABC1234");
      expect(resultado.valida).toBe(true);
      if (resultado.valida) expect(resultado.placa).toBe("ABC1234");
    });

    it("aceita placa válida com hífen", () => {
      const resultado = validarPlaca("ABC-1234");
      expect(resultado.valida).toBe(true);
      if (resultado.valida) expect(resultado.placa).toBe("ABC1234");
    });

    it("aceita placa em minúsculo e normaliza para maiúsculo", () => {
      const resultado = validarPlaca("abc1234");
      expect(resultado.valida).toBe(true);
      if (resultado.valida) expect(resultado.placa).toBe("ABC1234");
    });
  });

  describe("padrão Mercosul (ABC1D23)", () => {
    it("aceita placa Mercosul válida", () => {
      const resultado = validarPlaca("ABC1D23");
      expect(resultado.valida).toBe(true);
      if (resultado.valida) expect(resultado.placa).toBe("ABC1D23");
    });

    it("aceita placa Mercosul em minúsculo", () => {
      const resultado = validarPlaca("abc1d23");
      expect(resultado.valida).toBe(true);
      if (resultado.valida) expect(resultado.placa).toBe("ABC1D23");
    });
  });

  describe("placas inválidas", () => {
    it("rejeita placa muito curta", () => {
      const resultado = validarPlaca("AB123");
      expect(resultado.valida).toBe(false);
    });

    it("rejeita placa muito longa", () => {
      const resultado = validarPlaca("ABCD12345");
      expect(resultado.valida).toBe(false);
    });

    it("rejeita placa com formato errado", () => {
      const resultado = validarPlaca("1234ABC");
      expect(resultado.valida).toBe(false);
    });

    it("rejeita string vazia", () => {
      const resultado = validarPlaca("");
      expect(resultado.valida).toBe(false);
    });

    it("retorna mensagem de erro informativa", () => {
      const resultado = validarPlaca("INVALIDA");
      expect(resultado.valida).toBe(false);
      if (!resultado.valida) {
        expect(resultado.mensagem).toContain("ABC1234");
        expect(resultado.mensagem).toContain("ABC1D23");
      }
    });
  });
});
