import Image from "next/image";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import { factsLine, getPaintingById, getPaintings } from "@/lib/paintings";

export async function generateStaticParams() {
  const paintings = await getPaintings();
  return paintings.map((p) => ({ id: p.id }));
}

export default async function PaintingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const painting = await getPaintingById(id);

  if (!painting) {
    notFound();
  }

  const facts = factsLine(painting);

  return (
    <main className="flex-1 flex flex-col">
      <div className="px-4 sm:px-8 py-4">
        <BackButton />
      </div>

      <div className="w-full">
        <Image
          src={painting.imageSrc}
          alt={painting.title || "Untitled painting"}
          width={painting.width}
          height={painting.height}
          sizes="100vw"
          priority
          className="w-full h-auto"
        />
      </div>

      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto w-full text-center">
        <p className="text-[11px] uppercase tracking-widest text-muted mb-2">
          {painting.collection}
        </p>
        {painting.title ? (
          <h1 className="font-serif text-2xl">{painting.title}</h1>
        ) : (
          <h1 className="font-serif italic text-2xl text-muted">Untitled</h1>
        )}
        {facts && <p className="mt-2 text-sm text-muted">{facts}</p>}
      </div>
    </main>
  );
}
