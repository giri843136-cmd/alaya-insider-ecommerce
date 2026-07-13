import { Link } from "react-router-dom";
import { Camera, Play, Heart } from "lucide-react";
import { Reveal } from "../Reveal";
import { SectionHeading } from "../ui";
import { useStore } from "../../context/StoreContext";
import { wide } from "../../lib/utils";

const FEED = [
  { id: 4501, handle: "@studio.alaya", likes: 1240 },
  { id: 4502, handle: "@maison.clare", likes: 980 },
  { id: 4503, handle: "@the.atelier.edit", likes: 2104 },
  { id: 4504, handle: "@solene.jewelry", likes: 1560 },
  { id: 4505, handle: "@alya.fragrance", likes: 1830 },
  { id: 4506, handle: "@cedre.home", likes: 740 },
];

export function SocialProof() {
  const { settings } = useStore();
  return (
    <section className="border-t border-line bg-surface2/40 py-20">
      <div className="container-edge">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="@alaya.insider"
            title="Loved & shared"
            subtitle="Tag us to be featured. Real pieces, real people, real Insiders."
          />
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {FEED.map((f) => (
              <a
                key={f.id}
                href={settings.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-2xl bg-surface2"
              >
                <img
                  src={wide(f.id, 500, 500)}
                  alt={f.handle}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/50 group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                  <span className="flex items-center gap-1 text-xs font-medium text-white">
                    <Heart className="h-3 w-3 fill-white" /> {f.likes.toLocaleString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-primary btn-md">
              <Camera className="h-4 w-4" /> Follow on Instagram
            </a>
            <a href={settings.social.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline btn-md">
              <Play className="h-4 w-4" /> Watch on YouTube
            </a>
            <Link to="/collections/new" className="btn-ghost btn-md">Shop the looks</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
