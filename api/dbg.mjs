import kitsune from 'kitsune-engine'

export default async function handler(req, res) {
  try {
    const cleanTag = req.query.tag || 'fyp'

    const result = await kitsune(
      `https://www.tiktok.com/api/challenge/detail/?challengeName=${encodeURIComponent(cleanTag)}`,
      {
        userAgent: 'Mozilla/5.0',
        headers: {
          Accept: 'application/json'
        },
        executeExternalScripts: false
      }
    )

    return res.status(200).json({
      status: true,
      statusCode: result.status,
      url: result.url,
      contentType: result.headers?.['content-type'] ?? null,
      htmlLength: result.html?.length ?? 0,
      errors: result.errors,
      html: result.html
    })
  } catch (e) {
    return res.status(500).json({
      status: false,
      error: e.message
    })
  }
}
