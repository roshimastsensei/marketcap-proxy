// Vercel Edge Function
import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { ids, days, vs_currency = 'usd' } = req.query

    if (!ids || !days) {
      return res.status(400).json({ error: 'Missing required parameters: ids, days' })
    }

    const idList = Array.isArray(ids) ? ids : ids.split(',')
    const dayList = Array.isArray(days) ? days : days.split(',').map(Number)

    const today = new Date()
    const results: any[] = []

    // 1. Get current prices
    const currentPricesResp = await axios.get(`${COINGECKO_BASE}/simple/price`, {
      params: {
        ids: idList.join(','),
        vs_currencies: vs_currency
      }
    })

    const currentPrices = currentPricesResp.data

    // 2. Get historical prices
    for (const id of idList) {
      const prices: Record<string, number> = {}

      for (const day of dayList) {
        const date = new Date(today)
        date.setDate(date.getDate() - day)

        const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${date.getFullYear()}`

        try {
          const historyResp = await axios.get(`${COINGECKO_BASE}/coins/${id}/history`, {
            params: { date: formattedDate, localization: 'false' }
          })

          prices[`price_${day}d`] = historyResp.data?.market_data?.current_price?.[vs_currency] ?? null
        } catch (err) {
          prices[`price_${day}d`] = null
        }
      }

      results.push({
        id,
        current: currentPrices?.[id]?.[vs_currency] ?? null,
        ...prices
      })
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate')
    return res.status(200).json(results)
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'Internal server error' })
  }
}

