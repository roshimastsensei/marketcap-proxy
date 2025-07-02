
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ error: 'Missing ids parameter' });
  }

  const apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'MarketCapProxy/1.0 (bahray@project.app)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `CoinGecko API error: ${response.statusText}` });
    }

    const data = await response.json();
    const result = {};

    for (const token of data) {
      result[token.id] = token.market_cap ?? null;
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
