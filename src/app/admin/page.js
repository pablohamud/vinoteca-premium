"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const [session, setSession] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [wines, setWines] = useState([]);

  const [form, setForm] = useState({
    name: "",
    winery: "",
    varietal: "",
    terroir: "",
    price: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session) {
      fetchWines();
    }
  }

  async function login(e) {
    e.preventDefault();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      return;
    }

    checkSession();
  }

  async function logout() {
    await supabase.auth.signOut();

    setSession(null);
  }

  async function fetchWines() {
    const { data, error } = await supabase
      .from("wines")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setWines(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.from("wines").insert([
      {
        name: form.name,
        winery: form.winery,
        varietal: form.varietal,
        terroir: form.terroir,
        price: Number(form.price),
        image_url: form.image_url,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Vino guardado 🍷");

    setForm({
      name: "",
      winery: "",
      varietal: "",
      terroir: "",
      price: "",
      image_url: "",
    });

    fetchWines();
  }

  async function deleteWine(id) {
    const confirmDelete = confirm(
      "¿Eliminar este vino?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("wines")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchWines();
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-10">
        <form
          onSubmit={login}
          className="bg-white/5 border border-white/10 rounded-3xl p-10 w-full max-w-md space-y-4"
        >
          <h1 className="text-4xl font-bold text-[#d4a65a] mb-6">
            Admin Login
          </h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
          />

          <button className="w-full bg-[#7b1125] py-4 rounded-2xl">
            Ingresar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold text-[#d4a65a]">
          Panel Administrador
        </h1>

        <button
          onClick={logout}
          className="bg-red-700 px-4 py-2 rounded-xl"
        >
          Salir
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-3xl mb-16">
        <h2 className="text-2xl font-semibold mb-6">
          Cargar nuevo vino
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Nombre del vino"
          />

          <input
            value={form.winery}
            onChange={(e) =>
              setForm({ ...form, winery: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Bodega"
          />

          <input
            value={form.varietal}
            onChange={(e) =>
              setForm({ ...form, varietal: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Varietal"
          />

          <input
            value={form.terroir}
            onChange={(e) =>
              setForm({ ...form, terroir: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Terroir"
          />

          <input
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Precio"
          />

          <input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("wines")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("wines")
      .getPublicUrl(fileName);

    setForm({
      ...form,
      image_url: publicUrl,
    });
  }}
  className="w-full p-4 rounded-2xl bg-black border border-white/10"
/>

          <button
            disabled={loading}
            className="bg-[#7b1125] px-6 py-4 rounded-2xl"
          >
            {loading ? "Guardando..." : "Guardar vino"}
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {wines.map((wine) => (
          <div
            key={wine.id}
            className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
          >
            {wine.image_url && (
              <img
                src={wine.image_url}
                alt={wine.name}
                className="w-full h-72 object-cover"
              />
            )}

            <div className="p-6">
              <h3 className="text-2xl font-bold text-[#d4a65a]">
                {wine.name}
              </h3>

              <p className="text-white/70 mt-2">
                {wine.winery}
              </p>

              <button
                onClick={() =>
                  deleteWine(wine.id)
                }
                className="mt-6 bg-red-700 px-4 py-2 rounded-xl"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}