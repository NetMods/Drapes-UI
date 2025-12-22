import { Collections } from "@/components/layout/collections";
import { HeroSection } from "@/components/layout/hero";
import { Navbar } from "@/components/layout/navbar";
import { getGithubStar } from "@/lib/github";

export default async function Home() {

  let stars: number | null = null;

  try {
    stars = await getGithubStar("NetMods/Drapes-UI");
  } catch (err) {
    console.error('failed to fetch stars', err);
    stars = null;
  }

  const safeStars = typeof stars === 'number' ? stars : undefined;



  return (
    <main className="flex flex-col">
      <Navbar starsCount={safeStars} />
      <HeroSection />
      <Collections />
    </main>
  );
}
