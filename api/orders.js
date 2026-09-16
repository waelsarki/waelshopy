import { Resend } from 'resend'

const notificationEmail = 'waelshopy@gmail.com'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.RESEND_API_KEY) {
    response.status(503).json({ error: 'Email service is not configured' })
    return
  }

  try {
    const order = request.body
    const { name, phone, address, payment, items, subtotal, delivery, total } = order
    const itemLines = items.map((item) => `${item.quantity} x ${item.name} - ₦${(item.price * item.quantity).toFixed(2)}`).join('\n')
    const resend = new Resend(process.env.RESEND_API_KEY)
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
      response.status(502).json({ error: 'Email provider rejected the order notification' })
      return
    }
    response.status(200).json({ sent: true })
  } catch {
    response.status(400).json({ error: 'Invalid order notification request' })
  }
}
