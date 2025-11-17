import { Collections } from "@/components/layout/collections";
import { HeroSection } from "@/components/layout/hero";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/ui/command-palette";

export default function Home() {
  return (
    <main className="flex flex-col gap-30">
      <Navbar />
      <HeroSection />
      <Collections />
      <CommandPalette />
    </main>
  );
}
