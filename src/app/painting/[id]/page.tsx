import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import {
  factsLine,
  getPaintingById,
  getPaintingNavigation,
  getPaintings,
} from "@/lib/paintings";

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
  const navigation = await getPaintingNavigation(id);

  return (
    <main className="flex-1 flex flex-col">
      <div className="px-4 sm:px-8 py-4">
        <BackButton />
      </div>

      <div className="relative w-full">
        <Image
          src={painting.imageSrc}
          alt={painting.title || "Untitled painting"}
          width={painting.width}
          height={painting.height}
          sizes="100vw"
          priority
          className="w-full h-auto"
        />
        {navigation && (
          <>
            <Link
              href={`/painting/${navigation.prev.id}`}
              aria-label="Previous painting"
              className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-bone backdrop-blur-sm transition-colors hover:bg-ink/80"
            >
              <ArrowIcon direction="left" />
            </Link>
            <Link
              href={`/painting/${navigation.next.id}`}
              aria-label="Next painting"
              className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-bone backdrop-blur-sm transition-colors hover:bg-ink/80"
            >
              <ArrowIcon direction="right" />
            </Link>
          </>
        )}
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

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}
