import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.type !== "payment") {
      return Response.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return Response.json({ received: true });

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

    // Solo procesar pagos aprobados
    if (payment.status !== "approved") {
      return Response.json({ received: true, status: payment.status });
    }

    // Verificar que no se procesó antes
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("mp_payment_id", String(paymentId))
      .maybeSingle();

    if (existing) {
      return Response.json({ received: true, duplicate: true });
    }

    // Guardar el pedido
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

    // Descontar stock por cada item vendido
    const items = payment.additional_info?.items || [];
    for (const item of items) {
      const { data: wine } = await supabase
        .from("wines")
        .select("stock")
        .eq("id", item.id)
        .maybeSingle();

      if (wine) {
        const newStock = Math.max(0, (wine.stock || 0) - Number(item.quantity));
        await supabase
          .from("wines")
          .update({ stock: newStock })
          .eq("id", item.id);
      }
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