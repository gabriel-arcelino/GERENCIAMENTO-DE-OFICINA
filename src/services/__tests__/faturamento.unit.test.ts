import { describe, it, expect } from "vitest";
import { calcularSaldoOS } from "../faturamento";

// Helper para simular valores Decimal do Prisma como número
const num = (n: number) => ({ toNumber: () => n });

describe("calcularSaldoOS", () => {
  const itens100reais = [{ quantidade: num(1), valorUnitario: num(100) }];
  const itens500reais = [{ quantidade: num(1), valorUnitario: num(500) }];
  const itens400reais = [{ quantidade: num(2), valorUnitario: num(200) }];

  describe("quitação", () => {
    it("quitado quando soma de pagamentos = total OS", () => {
      const pagamentos = [{ valor: num(100) }];
      const saldo = calcularSaldoOS(pagamentos, itens100reais);
      expect(saldo.quitado).toBe(true);
      expect(saldo.saldoDevedor).toBe(0);
      expect(saldo.troco).toBe(0);
    });

    it("quitado com dois pagamentos parciais (spec: R$300 PIX + R$200 cartão em OS de R$500)", () => {
      const pagamentos = [{ valor: num(300) }, { valor: num(200) }];
      const saldo = calcularSaldoOS(pagamentos, itens500reais);
      expect(saldo.quitado).toBe(true);
      expect(saldo.totalOS).toBe(500);
      expect(saldo.totalPago).toBe(500);
      expect(saldo.saldoDevedor).toBe(0);
    });
  });

  describe("saldo devedor (spec: entrega com saldo pendente)", () => {
    it("não quitado quando pagamento parcial", () => {
      // Spec: OS de R$400 com R$100 pago → R$300 em aberto
      const pagamentos = [{ valor: num(100) }];
      const saldo = calcularSaldoOS(pagamentos, itens400reais);
      expect(saldo.quitado).toBe(false);
      expect(saldo.totalOS).toBe(400);
      expect(saldo.totalPago).toBe(100);
      expect(saldo.saldoDevedor).toBe(300);
    });

    it("não quitado quando sem pagamentos", () => {
      const saldo = calcularSaldoOS([], itens500reais);
      expect(saldo.quitado).toBe(false);
      expect(saldo.saldoDevedor).toBe(500);
    });
  });

  describe("overpayment (spec: valor pago maior que o total)", () => {
    it("calcula troco quando pago > total", () => {
      const pagamentos = [{ valor: num(600) }];
      const saldo = calcularSaldoOS(pagamentos, itens500reais);
      expect(saldo.quitado).toBe(true);
      expect(saldo.troco).toBe(100);
      expect(saldo.saldoDevedor).toBe(0);
    });
  });

  describe("OS sem itens", () => {
    it("totalOS é 0 e não é quitado", () => {
      const saldo = calcularSaldoOS([], []);
      expect(saldo.totalOS).toBe(0);
      expect(saldo.quitado).toBe(false);
    });
  });
});
