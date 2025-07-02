import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ error: 'Missing ids parameter' });
  }

  const idList = ids.split(',').map((id) => id.trim());
  const batchSize = 50;
  const result = {};

  try {
    for (let i = 0; i < idList.length; i += batchSize) {
      const batch = idList.slice(i, i + batchSize);
      const apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${batch.join(',')}`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'MarketCapProxy/1.0 (bahray@project.app)',
        },
      });

      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const returnedIds = new Set(data.map((token) => token.id));

      // Traitement des résultats reçus
      for (const token of data) {
        result[token.id] = token.market_cap ?? null;
      }

      // Détection des IDs manquants
      const missingIds = batch.filter((id) => !returnedIds.has(id));

      for (const missingId of missingIds) {
        // ➕ Fallback via /coins/{id}
        const fallbackUrl = `https://api.coingecko.com/api/v3/coins/${missingId}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'MarketCapProxy/1.0 (bahray@project.app)',
          },
        });

        if (!fallbackResponse.ok) {
          console.warn(`Fallback failed for ${missingId}`);
          result[missingId] = 'COINGECKO CHANGE';
          continue;
        }

        const fallbackData = await fallbackResponse.json();
        result[missingId] = fallbackData.market_data?.market_cap?.usd ?? 'COINGECKO CHANGE';
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
