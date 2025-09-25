import Hero from "@/components/Hero";
import { loadHeroProps } from "@/lib/spec";

export default function Page() {
  const props = loadHeroProps();
  return <Hero {...props} />;
}
