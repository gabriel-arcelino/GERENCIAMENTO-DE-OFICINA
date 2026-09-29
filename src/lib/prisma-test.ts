/**
 * Cliente Prisma exclusivo para testes de integração.
 * Aponta para DATABASE_URL_TEST para isolar os dados de teste.
 */
import { PrismaClient } from "@prisma/client";

const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
  log: ["error"],
});
