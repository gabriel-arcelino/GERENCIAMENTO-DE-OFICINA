import { describe, it, expect } from "vitest";
import {
  isTransicaoValida,
  TRANSICOES_VALIDAS,
  STATUS_FINAIS,
  calcularTotalOS,
} from "../ordemServico";
import { StatusOS } from "@prisma/client";

describe("Máquina de estados — OS", () => {
  describe("transições válidas", () => {
    it("RECEBIDO → DIAGNOSTICO é válida", () => {
      expect(isTransicaoValida(StatusOS.RECEBIDO, StatusOS.DIAGNOSTICO)).toBe(true);
    });

    it("DIAGNOSTICO → AGUARDANDO_APROVACAO é válida", () => {
      expect(isTransicaoValida(StatusOS.DIAGNOSTICO, StatusOS.AGUARDANDO_APROVACAO)).toBe(true);
    });

    it("AGUARDANDO_APROVACAO → APROVADO é válida", () => {
      expect(isTransicaoValida(StatusOS.AGUARDANDO_APROVACAO, StatusOS.APROVADO)).toBe(true);
    });

    it("AGUARDANDO_APROVACAO → REPROVADO é válida", () => {
      expect(isTransicaoValida(StatusOS.AGUARDANDO_APROVACAO, StatusOS.REPROVADO)).toBe(true);
    });

    it("APROVADO → EM_EXECUCAO é válida", () => {
      expect(isTransicaoValida(StatusOS.APROVADO, StatusOS.EM_EXECUCAO)).toBe(true);
    });

    it("EM_EXECUCAO → CONFERENCIA é válida", () => {
      expect(isTransicaoValida(StatusOS.EM_EXECUCAO, StatusOS.CONFERENCIA)).toBe(true);
    });

    it("CONFERENCIA → PRONTO_PARA_ENTREGA é válida", () => {
      expect(isTransicaoValida(StatusOS.CONFERENCIA, StatusOS.PRONTO_PARA_ENTREGA)).toBe(true);
    });

    it("PRONTO_PARA_ENTREGA → ENTREGUE é válida", () => {
      expect(isTransicaoValida(StatusOS.PRONTO_PARA_ENTREGA, StatusOS.ENTREGUE)).toBe(true);
    });
  });

  describe("transições inválidas (spec: transições estritas)", () => {
    it("RECEBIDO → EM_EXECUCAO é inválida (pulo de etapas)", () => {
      expect(isTransicaoValida(StatusOS.RECEBIDO, StatusOS.EM_EXECUCAO)).toBe(false);
    });

    it("DIAGNOSTICO → APROVADO é inválida (bypassa gate de aprovação)", () => {
      expect(isTransicaoValida(StatusOS.DIAGNOSTICO, StatusOS.APROVADO)).toBe(false);
    });

    it("APROVADO → ENTREGUE é inválida (bypassa execução)", () => {
      expect(isTransicaoValida(StatusOS.APROVADO, StatusOS.ENTREGUE)).toBe(false);
    });

    it("ENTREGUE → qualquer status é inválida (status final)", () => {
      for (const status of Object.values(StatusOS)) {
        expect(isTransicaoValida(StatusOS.ENTREGUE, status)).toBe(false);
      }
    });

    it("REPROVADO → qualquer status é inválida (status final)", () => {
      for (const status of Object.values(StatusOS)) {
        expect(isTransicaoValida(StatusOS.REPROVADO, status)).toBe(false);
      }
    });

    it("AGUARDANDO_APROVACAO → EM_EXECUCAO é inválida (bypassa gate)", () => {
      expect(
        isTransicaoValida(StatusOS.AGUARDANDO_APROVACAO, StatusOS.EM_EXECUCAO)
      ).toBe(false);
    });
  });

  describe("status finais", () => {
    it("ENTREGUE é status final", () => {
      expect(STATUS_FINAIS).toContain(StatusOS.ENTREGUE);
    });

    it("REPROVADO é status final", () => {
      expect(STATUS_FINAIS).toContain(StatusOS.REPROVADO);
    });

    it("RECEBIDO não é status final", () => {
      expect(STATUS_FINAIS).not.toContain(StatusOS.RECEBIDO);
    });
  });

  describe("completude da máquina de estados", () => {
    it("todos os status do enum têm transições definidas", () => {
      for (const status of Object.values(StatusOS)) {
        expect(TRANSICOES_VALIDAS[status]).toBeDefined();
      }
    });
  });
});

describe("calcularTotalOS", () => {
  it("calcula corretamente com múltiplos itens", () => {
    const itens = [
      { quantidade: 2, valorUnitario: 50 },
      { quantidade: 1, valorUnitario: 150 },
      { quantidade: 3, valorUnitario: 10 },
    ];
    // 2*50 + 1*150 + 3*10 = 100 + 150 + 30 = 280
    expect(calcularTotalOS(itens)).toBe(280);
  });

  it("retorna 0 para lista vazia", () => {
    expect(calcularTotalOS([])).toBe(0);
  });

  it("funciona com um único item", () => {
    expect(calcularTotalOS([{ quantidade: 5, valorUnitario: 100 }])).toBe(500);
  });
});
