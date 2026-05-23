import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!items || items.length === 0) {
      return Response.json(
        { error: "No hay items en el carrito" },
        { status: 400 }
      );
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          id: String(item.id),
          title: item.name,
          description: `${item.winery} - ${item.varietal}`,
          picture_url: item.image_url || "",
          category_id: "food",
          quantity: item.quantity,
          currency_id: "ARS",
          unit_price: Number(item.price),
        })),
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/pago/exito`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pago/fallo`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pago/pendiente`,
        },
        auto_return: "approved",
        statement_descriptor: "VINOTECA PREMIUM",
        external_reference: `order-${Date.now()}`,
      },
    });

    return Response.json({ init_point: result.init_point });
  } catch (error) {
    console.error("Error MP:", error);
    return Response.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}