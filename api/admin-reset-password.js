module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }
  try {
    const SUPABASE_URL = 'https://rsebinhkyijetmfwnugl.supabase.co'
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZWJpbmhreWlqZXRtZndudWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0Mzk1NzEsImV4cCI6MjA5MzAxNTU3MX0.C4WlOxrG6ilhDfaMkFhtfl_HxLRXC2Pkf4gcpGZTouE'
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SERVICE_KEY) { res.status(500).json({ error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor' }); return }
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) { res.status(401).json({ error: 'Falta token de autenticacion' }); return }
    const body = req.body || {}
      const email = body.email
    const newPassword = body.newPassword
    if (!email || !newPassword || String(newPassword).length < 6) { res.status(400).json({ error: 'Datos invalidos' }); return }
    const callerRes = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token } })
    if (!callerRes.ok) { res.status(401).json({ error: 'Token invalido' }); return }
    const callerUser = await callerRes.json()
    const callerEmail = callerUser.email
    const checkRes = await fetch(SUPABASE_URL + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(callerEmail) + '&select=rol,activo', { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } })
    const checkData = await checkRes.json()
    const callerRow = Array.isArray(checkData) ? checkData[0] : null
    if (!callerRow || callerRow.rol !== 'admin' || !callerRow.activo) { res.status(403).json({ error: 'No autorizado' }); return }
    let targetId = null
    let page = 1
    while (!targetId) {
      const listRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users?page=' + page + '&per_page=200', { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY } })
      if (!listRes.ok) { res.status(500).json({ error: 'Error buscando usuario en Auth' }); return }
      const listData = await listRes.json()
      const users = listData.users || []
        const found = users.find(u => u.email === email)
      if (found) { targetId = found.id; break }
      if (users.length < 200) break
      page++
    }
    if (!targetId) { res.status(404).json({ error: 'Usuario no encontrado en Auth' }); return }
    const updateRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + targetId, { method: 'PUT', headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) })
    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}))
      res.status(500).json({ error: 'Error al cambiar la contrasena: ' + (errData.msg || updateRes.status) })
      return
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error interno: ' + (e.message || e) })
  }
}
