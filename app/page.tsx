import { Collections } from "@/components/layout/collections";
import { HeroSection } from "@/components/layout/hero";
import { Navbar } from "@/components/layout/navbar";
import { getGithubStar } from "@/lib/github";

export default async function Home() {
  const stars = await getGithubStar("NetMods/Drapes-UI");

  return (
    <main className="flex flex-col">
      <Navbar starsCount={stars} />
      <HeroSection />
      <Collections />
    </main>
  );
}
