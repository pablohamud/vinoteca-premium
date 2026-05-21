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

  useEffect(() => {
    fetchWines();
  }, []);

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

  const filteredWines = wines.filter((wine) => {
    return (
      wine.name
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      wine.varietal
        .toLowerCase()
        .includes(varietal.toLowerCase()) &&
      wine.terroir
        .toLowerCase()
        .includes(terroir.toLowerCase()) &&
      (maxPrice === "" ||
        wine.price <= Number(maxPrice))
    );
  });

  return (
    <main className="min-h-screen bg-black text-white p-10">
      {/* HEADER */}

      <div className="mb-12">
        <h1 className="text-6xl font-bold text-[#d4a65a] mb-4">
          VINOTECA PREMIUM
        </h1>

        <p className="text-white/70 text-xl">
          Descubre vinos extraordinarios 🍷
        </p>

        {/* FILTROS */}

        <div className="grid md:grid-cols-4 gap-4 mt-10">
          <input
            type="text"
            placeholder="Buscar vino"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
          />

          <input
            type="text"
            placeholder="Varietal"
            value={varietal}
            onChange={(e) =>
              setVarietal(e.target.value)
            }
            className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
          />

          <input
            type="text"
            placeholder="Terroir"
            value={terroir}
            onChange={(e) =>
              setTerroir(e.target.value)
            }
            className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
          />

          <input
            type="number"
            placeholder="Precio máximo"
            value={maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value)
            }
            className="p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
          />
        </div>
      </div>

      {/* VINOS */}

      <div className="grid md:grid-cols-3 gap-8">
        {filteredWines.map((wine) => (
          <div
            key={wine.id}
            className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:scale-105 transition duration-300"
          >
            {wine.image_url && (
              <img
                src={wine.image_url}
                alt={wine.name}
                className="w-full h-80 object-cover"
              />
            )}

            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#d4a65a]">
                {wine.name}
              </h2>

              <p className="text-white/70 mt-2">
                {wine.winery}
              </p>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm bg-[#7b1125] px-3 py-1 rounded-full">
                  {wine.varietal}
                </span>

                <span className="font-bold text-xl">
                  ${wine.price}
                </span>
              </div>

              <p className="mt-4 text-white/60 text-sm">
                {wine.terroir}
              </p>
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
    </main>
  );
}