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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) fetchWines();
  }

  async function login(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); return; }
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
    if (error) { console.log(error); return; }
    setWines(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("wines").insert([{
      name: form.name,
      vintage: form.vintage,
      winery: form.winery,
      varietal: form.varietal,
      winemaker: form.winemaker,
      terroir: form.terroir,
      province: form.province,
      country: form.country,
      alcohol: form.alcohol,
      volume: form.volume,
      tasting_notes: form.tasting_notes,
      stock: Number(form.stock),
      price: Number(form.price),
      image_url: form.image_url,
      featured: form.featured,
      category: form.category,
    }]);
    setLoading(false);
    if (error) { alert(error.message); return; }
    alert("Vino guardado 🍷");
    setForm({ name: "", winery: "", varietal: "", terroir: "", winemaker: "", country: "", province: "", vintage: "", alcohol: "", stock: "", volume: "", tasting_notes: "", price: "", image_url: "", featured: false, category: "vino" });
    fetchWines();
  }

  async function toggleFeatured(wine) {
    const { error } = await supabase
      .from("wines")
      .update({ featured: !wine.featured })
      .eq("id", wine.id);
    if (error) { alert(error.message); return; }
    fetchWines();
  }

  async function deleteWine(id) {
    const confirmDelete = confirm("¿Eliminar este vino?");
    if (!confirmDelete) return;
    const { error } = await supabase.from("wines").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    fetchWines();
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-10">
        <form
          onSubmit={login}
          className="bg-white/5 border border-white/10 rounded-3xl p-10 w-full max-w-md space-y-4"
        >
          <h1 className="text-4xl font-bold text-[#d4a65a] mb-6">Admin Login</h1>
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
        <h1 className="text-5xl font-bold text-[#d4a65a]">Panel Administrador</h1>
        <div className="flex gap-3">
          <a
            href="https://escudowines.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/20 transition px-5 py-2 rounded-xl text-sm"
          >
            🌐 EscudoWines
          </a>
          <a href="/admin/planes" className="bg-[#d4a65a] hover:bg-[#e6b96a] text-black font-bold px-5 py-2 rounded-xl text-sm transition">
            👑 Planes del Club
          </a>
          <button onClick={logout} className="bg-red-700 px-4 py-2 rounded-xl">
            Salir
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-3xl mb-16">
        <h2 className="text-2xl font-semibold mb-6">Cargar nuevo producto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
          >
            <option value="vino">🍷 Vino</option>
            <option value="Membresía">👑Membresía</option>
            <option value="espumante">🥂 Espumante</option>
            <option value="whisky">🥃 Whisky</option>
            <option value="gin">🍸 Gin</option>
            <option value="copa">🍷 Copa</option>
            <option value="accesorio">🛠️ Accesorio</option>
            <option value="pack">🎁 Pack</option>
            <option value="vodka">🍸 Vodka</option>
            <option value="ron">🥃 Ron</option>
            <option value="tequila">🌵 Tequila</option>
            <option value="licor">🍹 Licor</option>
            <option value="cerveza">🍺 Cerveza</option>
            <option value="champagne">🍾 Champagne</option>
            <option value="delicatessen">🧀 Delicatessen</option>
            <option value="gift">🎁 Gift Box</option>
            <option value="decanter">🏺 Decanter</option>
            <option value="sacacorchos">🛠️ Sacacorchos</option>
            <option value="cuchillo">🔪 Cuchillo</option>
            <option value="tabla">🪵 Tabla</option>
            <option value="experiencia">✨ Experiencia</option>
            <option value="fiambre">🥩 Fiambre</option>
            <option value="club">👑 Club de Catas</option>
          </select>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Marca"
          />
          <input
            value={form.winery}
            onChange={(e) => setForm({ ...form, winery: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Bodega"
          />
          <input
            value={form.varietal}
            onChange={(e) => setForm({ ...form, varietal: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Varietal"
          />
          <input
            value={form.vintage}
            onChange={(e) => setForm({ ...form, vintage: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Añada"
          />
          <input
            value={form.winemaker}
            onChange={(e) => setForm({ ...form, winemaker: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Enólogo"
          />
          <input
            value={form.alcohol}
            onChange={(e) => setForm({ ...form, alcohol: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Alcohol"
          />
          <input
            value={form.tasting_notes}
            onChange={(e) => setForm({ ...form, tasting_notes: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Notas de Cata"
          />
          <input
            value={form.terroir}
            onChange={(e) => setForm({ ...form, terroir: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Terroir"
          />
          <input
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Provincia"
          />
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="País"
          />
          <input
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
            placeholder="Stock"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
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
              const { error } = await supabase.storage.from("wines").upload(fileName, file);
              if (error) { alert(error.message); return; }
              const { data: { publicUrl } } = supabase.storage.from("wines").getPublicUrl(fileName);
              setForm({ ...form, image_url: publicUrl });
            }}
            className="w-full p-4 rounded-2xl bg-black border border-white/10"
          />

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-5 h-5 accent-[#d4a65a] cursor-pointer"
            />
            <span className="text-white/80 text-lg">⭐ Recomendado (aparece en portada)</span>
          </label>

          <button
            disabled={loading}
            className="bg-[#7b1125] px-6 py-4 rounded-2xl"
          >
            {loading ? "Guardando..." : "Guardar producto"}
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
              <h3 className="text-2xl font-bold text-[#d4a65a]">{wine.name}</h3>
              <p className="text-white/70 mt-2">{wine.winery}</p>
              <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wine.featured || false}
                  onChange={() => toggleFeatured(wine)}
                  className="w-5 h-5 accent-[#d4a65a] cursor-pointer"
                />
                <span className="text-white/70 text-sm">⭐ Recomendado</span>
              </label>
              <button
                onClick={() => deleteWine(wine.id)}
                className="mt-4 bg-red-700 px-4 py-2 rounded-xl"
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