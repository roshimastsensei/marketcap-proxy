import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { ids, days, vs_currency = 'usd' } = req.query

    if (!ids || !days) {
      console.error('❌ Missing parameters: ids or days')
      return res.status(400).json({ error: 'Missing required parameters: ids, days' })
    }

    const idList = Array.isArray(ids) ? ids : ids.split(',')
    const dayList = Array.isArray(days) ? days.map(Number) : days.split(',').map(Number)

    console.log('✅ Proxy called with:', { ids: idList, days: dayList })

    const today = new Date()
    const results: any[] = []

    // Bloc current prices blindé
    let currentPrices
    try {
      const currentPricesResp = await axios.get(`${COINGECKO_BASE}/simple/price`, {
        params: {
          ids: idList.join(','),
          vs_currencies: vs_currency
        }
      })
      currentPrices = currentPricesResp.data
    } catch (err: any) {
      console.error('❌ currentPrices failed:', err?.response?.status, err?.response?.data || err.message || err)
      return res.status(500).json({
        error: 'currentPrices failed',
        status: err?.response?.status,
        details: err?.response?.data || err.message || err
      })
    }

    // Boucle par token
    for (const id of idList) {
      const prices: Record<string, number | null> = {}

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
          const histPrice = historyResp.data?.market_data?.current_price?.[vs_currency]
          prices[`price_${day}d`] = histPrice ?? null
        } catch (err: any) {
          console.warn(`⚠️ history fetch failed for ${id} (${day}d):`, err?.message || err)
          prices[`price_${day}d`] = null
        }
      }

      results.push({
        id,
        current: currentPrices?.[id]?.[vs_currency] ?? null,
        ...prices
      })
    }

    console.log('✅ Sending final JSON response')
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate')
    return res.status(200).json(results)
  } catch (err: any) {
    console.error('🔥 Unexpected crash:', err?.message || err)
    return res.status(500).json({
      error: 'Unexpected server error',
      details: err?.message || err
    })
  }
}

