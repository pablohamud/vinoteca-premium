"use client";
import Link from "next/link";

export default function PagoFallo() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-10">
      <div className="text-center max-w-lg">
        <div className="text-8xl mb-6">😕</div>
        <h1 className="text-5xl font-bold text-red-400 mb-4">
          El pago no se completó
        </h1>
        <p className="text-white/70 text-xl mb-10">
          Hubo un problema con tu pago. Podés intentarlo de nuevo o contactarnos si el problema persiste.
        </p>
        <Link href="/" className="bg-[#7b1125] hover:bg-[#9b1535] text-white font-bold px-8 py-4 rounded-2xl transition text-lg">
          Volver al catálogo
        </Link>
      </div>
    </main>
  );
}