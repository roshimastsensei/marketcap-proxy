// /api/market_chart.ts
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  const days = searchParams.get("days") ?? "7";

  if (!idsParam) {
    return new Response(JSON.stringify({ error: "Missing parameter: ids" }), { status: 400 });
  }

  const ids = idsParam.split(",");

  const headers = {
    "User-Agent": "UndefinedUser-Agent",
  };

  const results: Record<string, any> = {};

  for (const id of ids) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
        { headers }
      );

      if (!res.ok) {
        throw new Error(`❌ ${id}: ${res.status}`);
      }

      const data = await res.json();
      results[id] = data.prices;
    } catch (err: any) {
      results[id] = { error: err.message || "unknown error" };
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}
