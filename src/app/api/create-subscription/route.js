import { MercadoPagoConfig, PreApproval } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export async function POST(request) {
  try {
    const { plan } = await request.json();

    if (!plan) {
      return Response.json({ error: "Plan no especificado" }, { status: 400 });
    }

    const preApproval = new PreApproval(client);

    const result = await preApproval.create({
      body: {
        reason: plan.name,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(plan.price),
          currency_id: "ARS",
        },
        back_url: `${process.env.NEXT_PUBLIC_BASE_URL}/club`,
        status: "pending",
      },
    });

    return Response.json({ init_point: result.init_point });
  } catch (error) {
    console.error("Error MP Suscripción:", error);
    return Response.json(
      { error: "Error al crear la suscripción" },
      { status: 500 }
    );
  }
}