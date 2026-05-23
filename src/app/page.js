"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

  // --- CARRITO ---
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

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

  // --- FUNCIONES DEL CARRITO ---
  function addToCart(wine) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === wine.id);
      if (existing) {
        return prev.map((item) =>
          item.id === wine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setLoadingPayment(true);
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
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

  const filteredWines = wines.filter((wine) => {
    return (
      wine.name.toLowerCase().includes(search.toLowerCase()) &&
      wine.varietal.toLowerCase().includes(varietal.toLowerCase()) &&
      wine.terroir.toLowerCase().includes(terroir.toLowerCase()) &&
      (maxPrice === "" || wine.price <= Number(maxPrice))
    );
  });

  return (
    <main className="min-h-screen bg-black text-white p-10">
      {/* HEADER */}
      <div className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-6xl font-bold text-[#d4a65a] mb-4">
            VINOTECA PREMIUM
          </h1>
          <p className="text-white/70 text-xl">
            Descubre vinos extraordinarios 🍷
          </p>
        </div>

        {/* BOTÓN CARRITO */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative bg-[#7b1125] hover:bg-[#9b1535] transition px-6 py-3 rounded-2xl font-semibold text-lg"
        >
          🛒 Carrito
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#d4a65a] text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* FILTROS */}
      <div className="grid md:grid-cols-4 gap-4 mt-10">
        <input
          type="text"
          placeholder="Buscar vino"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
        />
        <input
          type="text"
          placeholder="Varietal"
          value={varietal}
          onChange={(e) => setVarietal(e.target.value)}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
        />
        <input
          type="text"
          placeholder="Terroir"
          value={terroir}
          onChange={(e) => setTerroir(e.target.value)}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
        />
        <input
          type="number"
          placeholder="Precio máximo"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
        />
      </div>

      {/* VINOS */}
      <div className="grid md:grid-cols-3 gap-8 mt-10">
        {filteredWines.map((wine) => (
          <div
            key={wine.id}
            className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:scale-105 transition duration-300 flex flex-col"
          >
            {wine.image_url && (
              <img
                src={wine.image_url}
                alt={wine.name}
                className="w-full h-80 object-cover"
              />
            )}
            <div className="p-6 flex flex-col flex-1">
              <h2 className="text-2xl font-bold text-[#d4a65a]">
                {wine.name}
              </h2>
              <p className="text-white/70 mt-2">{wine.winery}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm bg-[#7b1125] px-3 py-1 rounded-full">
                  {wine.varietal}
                </span>
                <span className="font-bold text-xl">${wine.price}</span>
              </div>
              <p className="mt-4 text-white/60 text-sm">{wine.terroir}</p>

              {/* BOTÓN AGREGAR AL CARRITO */}
              <button
                onClick={() => addToCart(wine)}
                className="mt-6 w-full bg-[#d4a65a] hover:bg-[#e6b96a] text-black font-bold py-3 rounded-2xl transition"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SIN RESULTADOS */}
      {filteredWines.length === 0 && (
        <div className="text-center mt-20 text-white/50 text-2xl">
          No se encontraron vinos 🍷
        </div>
      )}

      {/* DRAWER CARRITO */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          {/* Panel */}
          <div className="w-full max-w-md bg-[#111] border-l border-white/10 flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-[#d4a65a]">
                Tu carrito 🛒
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="text-white/50 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-white/50 text-center mt-10">
                  El carrito está vacío
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-white/5 rounded-2xl p-4"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-[#d4a65a]">{item.name}</p>
                      <p className="text-white/60 text-sm">{item.winery}</p>
                      <p className="font-bold mt-1">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10">
                <div className="flex justify-between text-xl font-bold mb-6">
                  <span>Total</span>
                  <span className="text-[#d4a65a]">
                    ${cartTotal.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loadingPayment}
                  className="w-full bg-[#009ee3] hover:bg-[#007ec0] text-white font-bold py-4 rounded-2xl transition text-lg disabled:opacity-60"
                >
                  {loadingPayment ? "Redirigiendo..." : "Pagar con Mercado Pago"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}