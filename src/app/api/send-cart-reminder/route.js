import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const { email, name, items, cartUrl } = await request.json();

  const itemsList = items.map(item => 
    `<li>${item.name} x${item.quantity} — $${(item.price * item.quantity).toLocaleString()}</li>`
  ).join('');

  const { error } = await resend.emails.send({
    from: 'Merxi <noreply@merxi.digitalpartner.com.ar>',
    to: email,
    subject: '¿Olvidaste algo en tu carrito? 🛒',
    html: `
      <h2>Hola ${name}!</h2>
      <p>Dejaste productos en tu carrito. ¡Todavía están disponibles!</p>
      <ul>${itemsList}</ul>
      <a href="${cartUrl}" style="background:#d4a65a;color:black;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Completar mi compra
      </a>
    `,
  });

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json({ success: true });
}