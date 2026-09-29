import { NextResponse } from "next/server";
import { buscarClientes } from "@/services/clientes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const termo = searchParams.get("q") ?? "";
  
  try {
    const clientes = await buscarClientes(termo);
    return NextResponse.json(clientes);
  } catch (e) {
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}
