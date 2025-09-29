import { loadHeroProps } from "@/lib/spec";
import HeroWithTimeline from "@/components/HeroWithTimeline";

export default function Page() {
  // Server-side: read files & build plain JSON props
  const props = loadHeroProps();

  // Pass ONLY serializable data to the client wrapper (no functions)
  return (
    <main className="relative min-h-screen">
      <HeroWithTimeline props={props} />
    </main>
  );
}
