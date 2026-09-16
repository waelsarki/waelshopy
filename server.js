import 'dotenv/config'
import http from 'node:http'
import { Resend } from 'resend'

const port = Number(process.env.PORT || 3001)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const notificationEmail = 'waelshopy@gmail.com'

const sendJson = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  response.end(JSON.stringify(body))
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' })
    response.end()
    return
  }

  if (request.method !== 'POST' || request.url !== '/api/orders') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  if (!resend) {
    sendJson(response, 503, { error: 'Email service is not configured' })
    return
  }

  try {
    let body = ''
    for await (const chunk of request) body += chunk
    const order = JSON.parse(body)
    const { name, phone, address, payment, items, subtotal, delivery, total } = order
    const itemLines = items.map((item) => `${item.quantity} x ${item.name} - ₦${(item.price * item.quantity).toFixed(2)}`).join('\n')
    const result = await resend.emails.send({
      from: 'Waelshopy Orders <onboarding@resend.dev>',
      to: notificationEmail,
      subject: `New Waelshopy order - ₦${Number(total).toFixed(2)}`,
      text: [
        'New Waelshopy order',
        '',
        `Customer: ${name}`,
        `Phone: ${phone}`,
        `Address: ${address}`,
        `Payment: ${payment}`,
        '',
        'Items:',
        itemLines,
        '',
        `Subtotal: ₦${Number(subtotal).toFixed(2)}`,
        `Delivery: ₦${Number(delivery).toFixed(2)}`,
        `Total: ₦${Number(total).toFixed(2)}`,
      ].join('\n'),
    })

    if (result.error) {
      sendJson(response, 502, { error: 'Email provider rejected the order notification' })
      return
    }
    sendJson(response, 200, { sent: true })
  } catch {
    sendJson(response, 400, { error: 'Invalid order notification request' })
  }
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing order server or set a different PORT in .env.`)
    process.exit(1)
  }
  throw error
})

server.listen(port, () => {
  console.log(`Waelshopy order server listening on http://localhost:${port}`)
})
