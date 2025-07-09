import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

export default async function handler(_: VercelRequest, res: VercelResponse) {
  try {
    console.log('🔍 Test proxy: calling /simple/price for bitcoin, ethereum')

    const response = await axios.get(`${COINGECKO_BASE}/simple/price`, {
      params: {
        ids: 'bitcoin,ethereum',
        vs_currencies: 'usd'
      }
    })

    console.log('✅ Success:', response.data)

    return res.status(200).json({
      message: 'Proxy is working',
      data: response.data
    })

  } catch (err: any) {
    console.error('❌ Test failed:', err?.response?.status, err?.response?.data || err.message || err)

    return res.status(500).json({
      error: 'Proxy test failed',
      status: err?.response?.status,
      details: err?.response?.data || err.message || err
    })
  }
}

