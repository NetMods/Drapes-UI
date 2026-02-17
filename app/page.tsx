import { Collections } from "@/components/layout/collections";
import { HeroSection } from "@/components/layout/hero";
import { Navbar } from "@/components/layout/navbar";
import { getGithubStar } from "@/lib/github";
import { cn } from "@/lib/utils";

export default async function Home() {
  const starsCount = await getGithubStar("NetMods/Drapes-UI");

  return (
    <main className="flex flex-col">
      <Navbar initialStars={starsCount} />
      <HeroSection />
      <Collections />
      <a
        className={cn(
          "font-sans font-semibold inline-flex gap-2 items-center cursor-pointer p-2 rounded-xl transition-all ease-linear",
          "absolute top-5 right-5 text-base-content/70 text-xs",
          process.env.NODE_ENV !== 'development' && "hidden"
        )}
        href="/test"
      >
        Go to test page
      </a>
    </main>
  );
}
