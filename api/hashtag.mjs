import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: false,
      error: 'Method Not Allowed'
    })
  }

  const { tag } = req.query

  if (!tag) {
    return res.status(400).json({
      status: false,
      error: 'Parameter tag wajib diisi'
    })
  }

  const cleanTag = String(tag).replace(/^#/, '').trim()

  try {
    const response = await axios.get(
      `https://www.tiktok.com/api/challenge/detail/?challengeName=${encodeURIComponent(cleanTag)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    )

    return res.status(200).json({
      status: true,
      result: response.data
    })
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      status: false,
      error: error.message,
      upstreamStatus: error.response?.status || null,
      upstreamData: error.response?.data || null
    })
  }
}
