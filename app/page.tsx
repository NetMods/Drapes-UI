import { Collections } from "@/components/layout/collections";
import { HeroSection } from "@/components/layout/hero";
import { Navbar } from "@/components/layout/navbar";
import { getGithubStar } from "@/lib/github";

export default async function Home() {
  const starsCount = await getGithubStar("NetMods/Drapes-UI");

  return (
    <main className="flex flex-col">
      <Navbar initialStars={starsCount} />
      <HeroSection />
      <Collections />
    </main>
  );
}
