// pages/api/market_chart.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ids = req.query.ids
  const days = req.query.days || '7'

  if (!ids || typeof ids !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid ids parameter' })
  }

  const idList = ids.split(',').map((id) => id.trim().toLowerCase())
  const result: Record<string, number[][] | null> = {}

  for (const id of idList) {
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RelativeStrengthMatrixBot/1.0 (contact: undefinedUser)',
        },
      })

      if (!response.ok) {
        console.warn(`Erreur CoinGecko ${response.status} pour ${id}`)
        result[id] = null
        continue
      }

      const json = await response.json()
      result[id] = json.prices || null

      // Petit delay pour respecter les limites d’appel API CoinGecko
      await new Promise((resolve) => setTimeout(resolve, 1250))
    } catch (e) {
      console.error(`Exception pour ${id} :`, e)
      result[id] = null
    }
  }

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(result)
}
