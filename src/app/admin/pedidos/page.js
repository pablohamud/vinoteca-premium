"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PedidosPage() {
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) fetchOrders();
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.log(error); return; }
    setOrders(data);
  }

  async function toggleDelivered(order) {
    const { error } = await supabase
      .from("orders")
      .update({ delivered: !order.delivered })
      .eq("id", order.id);
    if (error) { alert(error.message); return; }

    // Si se marca como entregado, descontar stock
    if (!order.delivered && order.items) {
      for (const item of order.items) {
        const { data: wine } = await supabase
          .from("wines")
          .select("stock")
          .eq("id", item.id)
          .single();
        if (wine) {
          const newStock = Math.max(0, (wine.stock || 0) - item.quantity);
          await supabase.from("wines").update({ stock: newStock }).eq("id", item.id);
        }
      }
    }

    fetchOrders();
  }

  async function deleteOrder(id) {
    if (!confirm("¿Eliminar este pedido?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    fetchOrders();
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "pending") return !order.delivered;
    if (filter === "delivered") return order.delivered;
    return true;
  });

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/50 text-xl">
          Acceso restringido.{" "}
          <a href="/admin" className="text-[#d4a65a] underline">Ir al login</a>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold text-[#d4a65a]">Panel de Pedidos</h1>
        <a href="/admin" className="bg-white/10 hover:bg-white/20 transition px-5 py-2 rounded-xl text-sm">
          ← Volver al admin
        </a>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-4xl font-bold text-white">{orders.length}</p>
          <p className="text-white/50 mt-1">Total pedidos</p>
        </div>
        <div className="bg-white/5 border border-yellow-700/30 rounded-2xl p-6 text-center">
          <p className="text-4xl font-bold text-yellow-400">{orders.filter(o => !o.delivered).length}</p>
          <p className="text-white/50 mt-1">Pendientes</p>
        </div>
        <div className="bg-white/5 border border-green-700/30 rounded-2xl p-6 text-center">
          <p className="text-4xl font-bold text-green-400">{orders.filter(o => o.delivered).length}</p>
          <p className="text-white/50 mt-1">Entregados</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-3 mb-8">
        {[
          { value: "all", label: "Todos" },
          { value: "pending", label: "⏳ Pendientes" },
          { value: "delivered", label: "✅ Entregados" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              filter === f.value
                ? "bg-[#d4a65a] text-black font-bold"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LISTA DE PEDIDOS */}
      {filteredOrders.length === 0 ? (
        <p className="text-white/30 text-center mt-20 text-xl">No hay pedidos todavía</p>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`border rounded-2xl p-6 ${
                order.delivered
                  ? "bg-green-900/10 border-green-700/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      order.mp_status === "approved"
                        ? "bg-green-800 text-green-200"
                        : "bg-yellow-800 text-yellow-200"
                    }`}>
                      {order.mp_status === "approved" ? "✅ Pago aprobado" : `⏳ ${order.mp_status || "pendiente"}`}
                    </span>
                    {order.delivered && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-800 text-blue-200 font-semibold">
                        📦 Entregado
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs">
                    {new Date(order.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#d4a65a]">
                  ${Number(order.total || 0).toLocaleString()}
                </p>
              </div>

              {/* DATOS DEL COMPRADOR */}
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                {order.buyer_name && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs">Nombre</p>
                    <p className="font-semibold">{order.buyer_name}</p>
                  </div>
                )}
                {order.buyer_email && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs">Email</p>
                    <p className="font-semibold text-sm">{order.buyer_email}</p>
                  </div>
                )}
                {order.buyer_phone && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs">Teléfono</p>
                    <p className="font-semibold">{order.buyer_phone}</p>
                  </div>
                )}
              </div>

              {/* PRODUCTOS */}
              {order.items && order.items.length > 0 && (
                <div className="mt-4">
                  <p className="text-white/40 text-xs mb-2">Productos</p>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                          )}
                          <div>
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-white/40 text-xs">{item.winery}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm">x{item.quantity}</p>
                          <p className="font-bold text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACCIONES */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => toggleDelivered(order)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    order.delivered
                      ? "bg-yellow-700 hover:bg-yellow-600"
                      : "bg-green-700 hover:bg-green-600"
                  }`}
                >
                  {order.delivered ? "↩ Marcar pendiente" : "✅ Marcar entregado"}
                </button>
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="bg-red-900/50 hover:bg-red-900 px-4 py-2 rounded-xl text-sm transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}