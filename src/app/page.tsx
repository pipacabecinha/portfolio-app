import Gallery from "@/components/Gallery";
import { getSortedPaintings } from "@/lib/paintings";

export default async function Home() {
  const sorted = await getSortedPaintings();

  return (
    <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl w-full mx-auto">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Portfolio</p>
        <h1 className="font-serif text-2xl">Filipa Cabecinha</h1>
      </header>
      <Gallery paintings={sorted} />
    </main>
  );
}
