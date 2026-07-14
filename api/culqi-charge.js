const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rsebinhkyijetmfwnugl.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Ofs4pJvD_TBDuOz0gkHLPA_nucPd3Vl'

function jsonHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  }
}

async function readJson(response) {
  const text = await response.text()
  try { return text ? JSON.parse(text) : {} } catch { return { message: text } }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const culqiPrivateKey = process.env.CULQI_PRIVATE_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!culqiPrivateKey || !serviceKey) {
      res.status(500).json({ error: 'Faltan variables privadas de Culqi o Supabase en Vercel.' })
      return
    }

    const authHeader = req.headers.authorization || ''
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!accessToken) {
      res.status(401).json({ error: 'Sesión no válida.' })
      return
    }

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
    })
    if (!userResponse.ok) {
      res.status(401).json({ error: 'Sesión vencida. Vuelve a iniciar sesión.' })
      return
    }
    const user = await userResponse.json()

    const { pedidoId, sourceId } = req.body || {}
    if (!pedidoId || !sourceId || !/^(tkn|ype)_(test|live)_/.test(String(sourceId))) {
      res.status(400).json({ error: 'Datos de pago incompletos o token inválido.' })
      return
    }

    const pedidoResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(pedidoId)}&select=id,numero,total,cliente_nombre,mesa,estado_pago,culqi_charge_id`,
      { headers: jsonHeaders(serviceKey) }
    )
    const pedidos = await readJson(pedidoResponse)
    const pedido = Array.isArray(pedidos) ? pedidos[0] : null
    if (!pedido) {
      res.status(404).json({ error: 'Pedido no encontrado.' })
      return
    }
    if (pedido.estado_pago === 'pagado' || pedido.culqi_charge_id) {
      res.status(409).json({ error: 'Este pedido ya registra un pago aprobado.' })
      return
    }

    const amount = Math.round(Number(pedido.total) * 100)
    if (!Number.isInteger(amount) || amount < 100) {
      res.status(400).json({ error: 'El monto del pedido no es válido para cobrar.' })
      return
    }

    const chargePayload = {
      amount,
      currency_code: 'PEN',
      email: user.email,
      source_id: sourceId,
      description: `Gregorisa - Pedido #${pedido.numero || pedido.id}`,
      metadata: {
        pedido_id: String(pedido.id),
        pedido_numero: String(pedido.numero || ''),
        mesa: String(pedido.mesa || ''),
        cliente: String(pedido.cliente_nombre || '')
      }
    }

    const chargeResponse = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${culqiPrivateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chargePayload)
    })
    const charge = await readJson(chargeResponse)

    if (!chargeResponse.ok || charge.object === 'error') {
      await fetch(`${SUPABASE_URL}/rest/v1/pagos`, {
        method: 'POST',
        headers: { ...jsonHeaders(serviceKey), Prefer: 'return=minimal' },
        body: JSON.stringify({
          pedido_id: pedido.id,
          proveedor: 'culqi',
          estado: 'rechazado',
          monto: Number(pedido.total),
          moneda: 'PEN',
          mensaje: charge.user_message || charge.merchant_message || charge.message || 'Pago rechazado',
          respuesta: charge
        })
      })
      res.status(chargeResponse.status >= 400 ? chargeResponse.status : 402).json({
        error: charge.user_message || charge.merchant_message || charge.message || 'Culqi rechazó el pago.'
      })
      return
    }

    const method = String(sourceId).startsWith('ype_') ? 'yape' : 'tarjeta'
    const lastFour = charge.source && charge.source.last_four ? charge.source.last_four : null
    const reference = charge.reference_code || charge.id

    const paymentRecord = {
      pedido_id: pedido.id,
      proveedor: 'culqi',
      estado: 'pagado',
      metodo: method,
      monto: Number(pedido.total),
      moneda: 'PEN',
      culqi_charge_id: charge.id,
      referencia: reference,
      ultimos_cuatro: lastFour,
      mensaje: charge.user_message || charge.merchant_message || 'Pago aprobado',
      respuesta: charge,
      pagado_por: user.email,
      pagado_at: new Date().toISOString()
    }

    const paymentResponse = await fetch(`${SUPABASE_URL}/rest/v1/pagos`, {
      method: 'POST',
      headers: { ...jsonHeaders(serviceKey), Prefer: 'return=representation' },
      body: JSON.stringify(paymentRecord)
    })
    if (!paymentResponse.ok) {
      const dbError = await readJson(paymentResponse)
      console.error('Pago aprobado en Culqi, pero no registrado:', dbError)
      res.status(500).json({ error: 'El pago fue aprobado, pero no pudo registrarse. Revisa CulqiPanel.', chargeId: charge.id })
      return
    }

    await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(pedido.id)}`, {
      method: 'PATCH',
      headers: { ...jsonHeaders(serviceKey), Prefer: 'return=minimal' },
      body: JSON.stringify({
        estado_pago: 'pagado',
        metodo_pago: method,
        referencia_pago: reference,
        culqi_charge_id: charge.id,
        fecha_pago: new Date().toISOString()
      })
    })

    res.status(200).json({
      ok: true,
      payment: {
        chargeId: charge.id,
        reference,
        method,
        lastFour,
        amount: Number(pedido.total),
        message: charge.user_message || 'Pago aprobado'
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'No se pudo completar el pago. Intenta nuevamente.' })
  }
}
