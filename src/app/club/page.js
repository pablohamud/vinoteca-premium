"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClubPage() {
  const [plans, setPlans] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("active", true)
      .order("price", { ascending: true });
    if (error) { console.log(error); return; }
    setPlans(data);
  }

  async function handleSubscribe(plan) {
    setLoadingId(plan.id);
    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Error al procesar la suscripción. Intentá de nuevo.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor de pagos.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-[#d4a65a] mb-4">
            Club de Catas 🍷
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Sumate a nuestro club exclusivo y recibí selecciones de vinos premium todos los meses, junto con notas de cata y maridajes.
          </p>
          <a href="/" className="inline-block mt-6 text-white/40 hover:text-white/70 transition text-sm">
            ← Volver al catálogo
          </a>
        </div>

        {/* PLANES */}
        {plans.length === 0 ? (
          <p className="text-white/40 text-center text-xl mt-20">
            Próximamente nuevos planes disponibles 🍷
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col hover:border-[#d4a65a]/50 transition duration-300"
              >
                <h2 className="text-2xl font-bold text-[#d4a65a] mb-3">{plan.name}</h2>
                <p className="text-white/60 text-sm flex-1">{plan.description}</p>
                <div className="mt-6 mb-8">
                  <span className="text-4xl font-bold">${Number(plan.price).toLocaleString()}</span>
                  <span className="text-white/50 text-sm">/mes</span>
                </div>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingId === plan.id}
                  className="w-full bg-[#009ee3] hover:bg-[#007ec0] text-white font-bold py-4 rounded-2xl transition disabled:opacity-60"
                >
                  {loadingId === plan.id ? "Procesando..." : "Suscribirme"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
