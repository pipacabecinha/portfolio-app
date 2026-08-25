"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Painting } from "@/lib/paintings";

export default function Gallery({
  paintings,
  collections,
}: {
  paintings: Painting[];
  collections: string[];
}) {
  const filters = useMemo(() => ["All", ...collections], [collections]);
  const [active, setActive] = useState<string>("All");

  const visible = useMemo(
    () => (active === "All" ? paintings : paintings.filter((p) => p.collection === active)),
    [paintings, active]
  );

  return (
    <div>
      <nav className="flex gap-5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {filters.map((filter) => {
          const isActive = filter === active;
          return (
            <button
              key={filter}
              onClick={() => setActive(filter)}
              className={`shrink-0 whitespace-nowrap pb-1 text-sm tracking-wide transition-colors border-b ${
                isActive
                  ? "text-ink border-ink"
                  : "text-muted border-transparent hover:text-ink"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
        {visible.map((painting) => (
          <Link key={painting.id} href={`/painting/${painting.id}`} className="group block">
            <div className="overflow-hidden">
              <Image
                src={painting.imageSrc}
                alt={painting.title || "Untitled painting"}
                width={painting.width}
                height={painting.height}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="w-full h-auto"
              />
            </div>
            <div className="mt-3">
              {painting.title ? (
                <p className="font-serif text-base leading-tight">{painting.title}</p>
              ) : (
                <p className="font-serif italic text-base leading-tight text-muted">Untitled</p>
              )}
              <p className="mt-1 text-[11px] uppercase tracking-widest text-muted">
                {painting.collection}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
