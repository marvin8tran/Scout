"use client";

import Image from "next/image";

const SPONSORS = [
  { name: "World U", logo: "/sponsors/world-u.png" },
  { name: "LA HACKS 2026", logo: "/sponsors/la-hacks-2026.png" },
  { name: "Ditto AI", logo: "/sponsors/ditto-ai.png" },
  { name: "Panda Express", logo: "/sponsors/panda-express.png" },
];

export default function SponsorCarousel() {
  return (
    <section className="w-full py-12 border-t border-gray-100 relative z-10">
      <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">
        Our Sponsors
      </h2>
      <div className="overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          {[...SPONSORS, ...SPONSORS].map((sponsor, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-8 sm:mx-12 flex items-center justify-center h-16"
            >
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                width={140}
                height={56}
                className="object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
