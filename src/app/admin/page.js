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
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    name: "",
    winery: "",
    varietal: "",
    terroir: "",
    winemaker: "",
    country: "",
    province: "",
    vintage: "",
    alcohol: "",
    stock: "",
    volume: "",
    tasting_notes: "",
    price: "",
    image_url: "",
    featured: false,
    category: "vino",
  };

  const [form, setForm] = useState(emptyForm);

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

    const { error } = await supabase.auth.signInWithPassword({
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

    const productData = {
      name: form.name,
      winery: form.winery,
      varietal: form.varietal,
      terroir: form.terroir,
      winemaker: form.winemaker,
      country: form.country,
      province: form.province,
      vintage: form.vintage,
      alcohol: form.alcohol,
      stock: Number(form.stock),
      volume: form.volume,
      tasting_notes: form.tasting_notes,
      price: Number(form.price),
      image_url: form.image_url,
      featured: form.featured,
      category: form.category,
    };

    let error;

    if (editingId) {
      const response = await supabase
        .from("wines")
        .update(productData)
        .eq("id", editingId);

      error = response.error;
    } else {
      const response = await supabase
        .from("wines")
        .insert([productData]);

      error = response.error;
    }

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(editingId ? "Producto actualizado ✅" : "Producto guardado 🍷");

    setForm(emptyForm);
    setEditingId(null);

    fetchWines();
  }

  function editWine(wine) {
    setEditingId(wine.id);

    setForm({
      name: wine.name || "",
      winery: wine.winery || "",
      varietal: wine.varietal || "",
      terroir: wine.terroir || "",
      winemaker: wine.winemaker || "",
      country: wine.country || "",
      province: wine.province || "",
      vintage: wine.vintage || "",
      alcohol: wine.alcohol || "",
      stock: wine.stock || "",
      volume: wine.volume || "",
      tasting_notes: wine.tasting_notes || "",
      price: wine.price || "",
      image_url: wine.image_url || "",
      featured: wine.featured || false,
      category: wine.category || "vino",
    });
  }

  async function toggleFeatured(wine) {
    const { error } = await supabase
      .from("wines")
      .update({
        featured: !wine.featured,
      })
      .eq("id", wine.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchWines();
  }

  async function deleteWine(id) {
    const confirmDelete = confirm("¿Eliminar este producto?");

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
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {editingId ? "Editar producto" : "Cargar nuevo producto"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
          >
            <option value="vino">🍷 Vino</option>
            <option value="Membresía">👑 Membresía</option>
            <option value="espumante">🥂 Espumante</option>
            <option value="whisky">🥃 Whisky</option>
            <option value="gin">🍸 Gin</option>
            <option value="pack">🎁 Pack</option>
            <option value="club">👑 Club de Catas</option>
          </select>

          {Object.keys(form).map((key) => {
            if (
              key === "featured" ||
              key === "category" ||
              key === "image_url"
            )
              return null;

            return (
              <input
                key={key}
                value={form[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]: e.target.value,
                  })
                }
                className="w-full p-4 rounded-2xl bg-black border border-white/10"
                placeholder={key}
              />
            );
          })}

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

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm({
                  ...form,
                  featured: e.target.checked,
                })
              }
            />

            ⭐ Recomendado
          </label>

          <button
            disabled={loading}
            className="bg-[#7b1125] px-6 py-4 rounded-2xl"
          >
            {loading
              ? "Guardando..."
              : editingId
              ? "Actualizar producto"
              : "Guardar producto"}
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
                onClick={() => editWine(wine)}
                className="mt-4 bg-[#d4a65a] text-black px-4 py-2 rounded-xl w-full"
              >
                Editar
              </button>

              <button
                onClick={() => deleteWine(wine.id)}
                className="mt-2 bg-red-700 px-4 py-2 rounded-xl w-full"
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