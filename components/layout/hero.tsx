import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr"
import { Matter } from "./blob"
import { cn } from "@/lib/utils"

export async function HeroSection() {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex justify-center text-base-content gap-10 px-10 min-[1250px]:gap-40 relative my-30 max-lg:mb-15">
      <div className="my-auto">
        <p
          className={cn(
            "font-serif max-md:text-center text-5xl max-md:leading-14 md:text-7xl",
            isDev && "text-center"
          )}
        >
          Ready to use <br /> lively backgrounds
        </p>

        <p
          className={cn(
            "font-sans mt-5 text-md sm:text-lg max-md:text-center text-base-content/70 max-w-130",
            isDev && "text-center mx-auto"
          )}
        >
          Independent components made using Tailwind and JSX that can easily integrate with your React JS and Next JS app.
        </p>

        <div
          className={cn(
            "w-full mt-5 flex max-md:justify-center select-none",
            isDev && "justify-center"
          )}
        >
          <a
            className={cn(
              "font-sans font-semibold inline-flex gap-2 items-center cursor-pointer p-2 rounded-xl transition-all ease-linear",
              "border border-white/15 bg-base-content/5 hover:bg-base-100/10 text-base-content/70 shadow-sm shadow-white/70"
            )}
            href="https://github.com/Netmods/Drapes-ui"
            target="_blank"
          >
            <GithubLogoIcon size={20} weight="bold" />
            Contribute Here
          </a>
        </div>
      </div>

      <div
        className={cn(
          "select-none max-lg:hidden max-w-1/2",
          isDev && "hidden"
        )}
      >
        <figure>
          <Matter />
        </figure>
      </div>
    </div>
  )
}
