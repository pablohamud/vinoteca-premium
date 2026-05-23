"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPlanesPage() {
  const [session, setSession] = useState(null);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) fetchPlans();
  }

  async function fetchPlans() {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.log(error); return; }
    setPlans(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ name: form.name, description: form.description, price: Number(form.price) })
        .eq("id", editingId);
      if (error) { alert(error.message); setLoading(false); return; }
      setEditingId(null);
    } else {
      const { error } = await supabase
        .from("subscription_plans")
        .insert([{ name: form.name, description: form.description, price: Number(form.price) }]);
      if (error) { alert(error.message); setLoading(false); return; }
    }
    setForm({ name: "", description: "", price: "" });
    setLoading(false);
    fetchPlans();
  }

  async function toggleActive(plan) {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ active: !plan.active })
      .eq("id", plan.id);
    if (error) { alert(error.message); return; }
    fetchPlans();
  }

  async function deletePlan(id) {
    if (!confirm("¿Eliminar este plan?")) return;
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    fetchPlans();
  }

  function startEdit(plan) {
    setEditingId(plan.id);
    setForm({ name: plan.name, description: plan.description || "", price: plan.price });
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/50 text-xl">Acceso restringido. <a href="/admin" className="text-[#d4a65a] underline">Ir al login</a></p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold text-[#d4a65a]">Planes del Club</h1>
        <a href="/admin" className="bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition">
          ← Volver al admin
        </a>
      </div>

      {/* FORMULARIO */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-2xl mb-16">
        <h2 className="text-2xl font-semibold mb-6">
          {editingId ? "✏️ Editar plan" : "➕ Nuevo plan"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Nombre del plan (ej: Club Básico)"
            required
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10 h-28 resize-none"
            placeholder="Descripción (qué incluye el plan)"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Precio mensual en ARS"
            required
          />
          <div className="flex gap-4">
            <button
              disabled={loading}
              className="bg-[#7b1125] px-6 py-4 rounded-2xl flex-1"
            >
              {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Crear plan"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm({ name: "", description: "", price: "" }); }}
                className="bg-white/10 px-6 py-4 rounded-2xl"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LISTA DE PLANES */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-3xl p-6 flex flex-col gap-4 ${
              plan.active
                ? "bg-white/5 border-white/10"
                : "bg-white/2 border-white/5 opacity-50"
            }`}
          >
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-[#d4a65a]">{plan.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${plan.active ? "bg-green-800 text-green-200" : "bg-red-900 text-red-300"}`}>
                  {plan.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-white/60 mt-2 text-sm">{plan.description}</p>
              <p className="text-2xl font-bold mt-4">${Number(plan.price).toLocaleString()}<span className="text-white/50 text-sm font-normal">/mes</span></p>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => toggleActive(plan)}
                className={`py-2 rounded-xl text-sm font-semibold ${plan.active ? "bg-yellow-700 hover:bg-yellow-600" : "bg-green-800 hover:bg-green-700"} transition`}
              >
                {plan.active ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => startEdit(plan)}
                className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm transition"
              >
                Editar
              </button>
              <button
                onClick={() => deletePlan(plan.id)}
                className="bg-red-900 hover:bg-red-800 py-2 rounded-xl text-sm transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <p className="text-white/40 text-center mt-20 text-xl">No hay planes creados todavía</p>
      )}
    </main>
  );
}
