import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();

    // MercadoPago envía el tipo de notificación
    if (body.type !== "payment") {
      return Response.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return Response.json({ received: true });

    // Consultar el pago a MP
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await mpResponse.json();

    if (!payment || payment.error) {
      return Response.json({ error: "Payment not found" }, { status: 400 });
    }

    // Guardar el pedido en Supabase
    const { error } = await supabase.from("orders").insert([{
      mp_payment_id: String(paymentId),
      mp_status: payment.status,
      total: payment.transaction_amount,
      buyer_email: payment.payer?.email || "",
      buyer_name: `${payment.payer?.first_name || ""} ${payment.payer?.last_name || ""}`.trim(),
      buyer_phone: payment.payer?.phone?.number || "",
      items: payment.additional_info?.items || [],
    }]);

    if (error) {
      console.error("Supabase error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "Webhook activo" });
}