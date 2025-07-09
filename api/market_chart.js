// =========================
// market_chart.js (Vercel API Proxy)
// =========================

import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get('ids');
  const days = searchParams.get('days');

  if (!ids || !days) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const idList = ids.split(',');
  const result = {};

  for (const id of idList) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
        {
          headers: {
            'User-Agent': 'UndefinedUser',
          },
        }
      );

      if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);

      const json = await res.json();
      result[id] = json.prices;
    } catch (e) {
      result[id] = null;
    }
  }

  return NextResponse.json({ prices: result });
}
