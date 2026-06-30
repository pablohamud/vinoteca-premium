"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [wines, setWines] = useState([]);
  const [search, setSearch] = useState("");
  const [varietal, setVarietal] = useState("");
  const [terroir, setTerroir] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryForm, setDeliveryForm] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    province: "",
    zip: "",
  });

  useEffect(() => {
    fetchWines();
  }, []);

  async function fetchWines() {
    const { data, error } = await supabase
      .from("wines")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.log(error); return; }
    setWines(data);
  }

  function addToCart(wine) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === wine.id);
      if (existing) {
        return prev.map((item) =>
          item.id === wine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...wine, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function updateQuantity(id, delta) {
    setCart((prev) =>
      prev
        .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0)
    );
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function canCheckout() {
    if (!deliveryType) return false;
    if (deliveryType === "envio") {
      return deliveryForm.name && deliveryForm.phone && deliveryForm.email && deliveryForm.street && deliveryForm.city;
    }
    if (deliveryType === "retiro") {
      return deliveryForm.name && deliveryForm.phone && deliveryForm.email;
    }
    return false;
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (!canCheckout()) return;
    // Guardar carrito abandonado
await supabase.from("abandoned_carts").insert([{
  email: deliveryForm.email,
  name: deliveryForm.name,
  items: cart,
  total: cartTotal,
}]);
    setLoadingPayment(true);
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          deliveryType,
          deliveryForm: deliveryType === "envio" ? deliveryForm : null,
        }),
      });
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Error al crear el pago. Intentá de nuevo.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor de pagos.");
    } finally {
      setLoadingPayment(false);
    }
  }

  const featuredWines = wines.filter((wine) => wine.featured);
  const hasFilters = search !== "" || varietal !== "" || terroir !== "" || maxPrice !== "";
  const filteredWines = wines.filter((wine) => {
    return (
      wine.name.toLowerCase().includes(search.toLowerCase()) &&
      (wine.varietal || "").toLowerCase().includes(varietal.toLowerCase()) &&
      (wine.terroir || "").toLowerCase().includes(terroir.toLowerCase()) &&
      (maxPrice === "" || wine.price <= Number(maxPrice))
    );
  });

  function WineCard({ wine }) {
    return (
      <div className="group relative bg-[#0d0d0d] border border-[#d4a65a]/20 rounded-2xl overflow-hidden hover:border-[#d4a65a]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,166,90,0.15)] flex flex-col">
        <div className="relative overflow-hidden">
          {wine.image_url ? (
            <img src={wine.image_url} alt={wine.name} className="w-full h-72 object-cover group-hover:scale-105 transition duration-500" />
          ) : (
            <div className="w-full h-72 bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-6xl opacity-20">🍷</span>
            </div>
          )}
          {wine.category && (
            <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-[#d4a65a] text-xs px-3 py-1 rounded-full border border-[#d4a65a]/30">
              {wine.category}
            </span>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h2 className="text-xl font-bold text-[#d4a65a] leading-tight">{wine.name}</h2>
          {wine.winery && <p className="text-white/50 text-sm mt-1">{wine.winery}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {wine.varietal && (
              <span className="text-xs bg-[#7b1125]/40 border border-[#7b1125]/50 text-white/80 px-2 py-1 rounded-full">{wine.varietal}</span>
            )}
            {wine.vintage && (
              <span className="text-xs bg-white/5 border border-white/10 text-white/60 px-2 py-1 rounded-full">{wine.vintage}</span>
            )}
            {wine.terroir && (
              <span className="text-xs bg-white/5 border border-white/10 text-white/60 px-2 py-1 rounded-full">{wine.terroir}</span>
            )}
          </div>
          {wine.tasting_notes && (
            <p className="mt-3 text-white/40 text-xs line-clamp-2">{wine.tasting_notes}</p>
          )}
          <div className="mt-auto pt-4 flex justify-between items-center">
            <span className="text-2xl font-bold text-white">${Number(wine.price).toLocaleString()}</span>
            {wine.stock === 0 ? (
              <span className="bg-red-900/40 border border-red-700/50 text-red-400 text-xs font-bold px-3 py-2 rounded-xl">Sin stock</span>
            ) : (
              <button onClick={() => addToCart(wine)} className="bg-[#d4a65a] hover:bg-[#e6b96a] text-black font-bold px-4 py-2 rounded-xl transition text-sm">
                + Agregar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-[#d4a65a]/20 bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt={process.env.NEXT_PUBLIC_STORE_NAME} width={50} height={50} className="object-contain" />
            <div>
              <h1 className="text-xl font-bold text-[#d4a65a] tracking-widest uppercase">{process.env.NEXT_PUBLIC_STORE_NAME}</h1>
              <p className="text-white/30 text-xs tracking-widest uppercase">{process.env.NEXT_PUBLIC_STORE_TAGLINE}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href={process.env.NEXT_PUBLIC_STORE_WEBSITE} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#d4a65a] transition text-sm hidden md:block">🌐 Sitio web</a>
            <a href="/club" className="text-white/40 hover:text-[#d4a65a] transition text-sm hidden md:block">👑 Club de Catas</a>
            <button onClick={() => setCartOpen(true)} className="relative bg-[#7b1125] hover:bg-[#9b1535] transition px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
              🛒 <span className="hidden md:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4a65a] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative border-b border-[#d4a65a]/10 py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(123,17,37,0.15)_0%,_transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-[#d4a65a]/60 text-sm tracking-[0.3em] uppercase mb-4">Bienvenido a</p>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">{process.env.NEXT_PUBLIC_STORE_NAME}</h2>
          <p className="text-white/40 text-lg">{process.env.NEXT_PUBLIC_STORE_TAGLINE}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-4 gap-3 mb-12">
          {[
            { placeholder: "🔍 Buscar producto", value: search, setter: setSearch, type: "text" },
            { placeholder: "🍇 Varietal", value: varietal, setter: setVarietal, type: "text" },
            { placeholder: "🗺️ Terroir", value: terroir, setter: setTerroir, type: "text" },
            { placeholder: "💰 Precio máximo", value: maxPrice, setter: setMaxPrice, type: "number" },
          ].map((filter, i) => (
            <input key={i} type={filter.type} placeholder={filter.placeholder} value={filter.value}
              onChange={(e) => filter.setter(e.target.value)}
              className="p-3.5 rounded-xl bg-white/5 border border-[#d4a65a]/20 outline-none focus:border-[#d4a65a]/50 transition text-sm placeholder-white/30"
            />
          ))}
        </div>

        {hasFilters ? (
          <>
            <h2 className="text-2xl font-bold text-white/70 mb-8 flex items-center gap-3">
              <span className="w-8 h-px bg-[#d4a65a]"></span>Resultados de búsqueda
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredWines.map((wine) => <WineCard key={wine.id} wine={wine} />)}
            </div>
            {filteredWines.length === 0 && (
              <div className="text-center mt-20 text-white/30 text-xl">No se encontraron productos 🍷</div>
            )}
          </>
        ) : (
          <>
            {featuredWines.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-[#d4a65a] mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-[#d4a65a]"></span>Selección Destacada
                </h2>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {featuredWines.map((wine) => <WineCard key={wine.id} wine={wine} />)}
                </div>
              </>
            ) : (
              <div className="text-center mt-20 text-white/30 text-xl">Usá el buscador para encontrar productos 🍷</div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#d4a65a]/10 mt-20 py-8 text-center text-white/20 text-sm">
        <p>{process.env.NEXT_PUBLIC_STORE_FOOTER}</p>
      </footer>

      {/* DRAWER CARRITO */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-[#0d0d0d] border-l border-[#d4a65a]/20 flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-[#d4a65a]/20">
              <h2 className="text-xl font-bold text-[#d4a65a]">Tu carrito 🛒</h2>
              <button onClick={() => setCartOpen(false)} className="text-white/30 hover:text-white text-2xl">✕</button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-white/30 text-center mt-10">El carrito está vacío</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />}
                    <div className="flex-1">
                      <p className="font-semibold text-[#d4a65a] text-sm">{item.name}</p>
                      <p className="text-white/40 text-xs">{item.winery}</p>
                      <p className="font-bold mt-1 text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm">−</button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-1 text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#d4a65a]/20 space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-3 font-semibold">¿Cómo querés recibirlo?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setDeliveryType("retiro")} className={`py-3 rounded-xl text-sm font-semibold border transition ${deliveryType === "retiro" ? "bg-[#d4a65a] text-black border-[#d4a65a]" : "bg-white/5 border-white/10 hover:border-[#d4a65a]/40"}`}>
                      🏪 Retiro en local
                    </button>
                    <button onClick={() => setDeliveryType("envio")} className={`py-3 rounded-xl text-sm font-semibold border transition ${deliveryType === "envio" ? "bg-[#d4a65a] text-black border-[#d4a65a]" : "bg-white/5 border-white/10 hover:border-[#d4a65a]/40"}`}>
                      🚚 Envío a domicilio
                    </button>
                  </div>
                </div>
                {deliveryType === "envio" && (
                  <div className="space-y-3">
                    <p className="text-white/60 text-sm font-semibold">Datos de envío</p>
                    {[
                      { key: "name", placeholder: "Nombre completo *" },
{ key: "phone", placeholder: "Teléfono *" },
{ key: "email", placeholder: "Email *" },
{ key: "street", placeholder: "Calle y número *" },
{ key: "city", placeholder: "Ciudad *" },
{ key: "province", placeholder: "Provincia" },
{ key: "zip", placeholder: "Código postal" },
                    ].map((field) => (
                      <input key={field.key} placeholder={field.placeholder} value={deliveryForm[field.key]}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, [field.key]: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#d4a65a]/50 outline-none text-sm placeholder-white/30"
                      />
                    ))}
                  </div>
                )}
                {deliveryType === "retiro" && (
                  <div className="space-y-3">
                    <p className="text-white/60 text-sm font-semibold">Datos de contacto</p>
                    {[
                      { key: "name", placeholder: "Nombre completo *" },
{ key: "phone", placeholder: "Teléfono *" },
{ key: "email", placeholder: "Email *" },
                    ].map((field) => (
                      <input key={field.key} placeholder={field.placeholder} value={deliveryForm[field.key]}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, [field.key]: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#d4a65a]/50 outline-none text-sm placeholder-white/30"
                      />
                    ))}
                    <p className="text-white/40 text-xs">📍 Te contactaremos para coordinar el retiro.</p>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white/60">Total</span>
                  <span className="text-[#d4a65a]">${cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handleCheckout} disabled={loadingPayment || !canCheckout()}
                  className="w-full bg-[#009ee3] hover:bg-[#007ec0] text-white font-bold py-4 rounded-xl transition text-base disabled:opacity-40 disabled:cursor-not-allowed">
                  {loadingPayment ? "Redirigiendo..." : !deliveryType ? "Elegí una opción de entrega" : "Pagar con Mercado Pago"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}