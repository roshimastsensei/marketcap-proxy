export default async function handler(req, res) {
  const { id, days } = req.query;

  if (!id || !days) {
    return res.status(400).json({ error: 'Missing id or days parameter' });
  }

  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from CoinGecko' });
    }

    const data = await response.json();
    return res.status(200).json({ prices: data.prices });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

