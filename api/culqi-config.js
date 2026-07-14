module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const publicKey = process.env.CULQI_PUBLIC_KEY || ''
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    enabled: Boolean(publicKey),
    publicKey,
    environment: publicKey.includes('_live_') ? 'production' : 'test'
  })
}
