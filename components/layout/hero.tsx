import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr"
import { Matter } from "./blob"
import { cn } from "@/lib/utils"

export const HeroSection = () => {
  return (
    <div className="flex justify-center text-base-content gap-10 px-10 min-[1250px]:gap-40 relative">
      <div className="my-auto">
        <p className="font-serif max-md:text-center text-5xl max-md:leading-14 md:text-7xl">Ready to use <br /> lively backgrounds</p>
        <p className="font-sans mt-5 text-md sm:text-lg max-md:text-center text-base-content/70 max-w-130">Independent components made using Tailwind and JSX that can easily integrate with your React JS and Next JS app.</p>

        <div className="w-full mt-5 flex max-md:justify-center select-none">
          <a
            className="font-sans inline-flex gap-2 items-center border border-base-content/30 bg-base-100/20 
          cursor-pointer p-2 rounded-xl hover:shadow-lg hover:bg-base-content/10 transition-all ease-linear"
            href="https://github.com/Netmods/Drapes-ui"
            target="_blank"
          >
            <GithubLogoIcon size={20} />
            Contribute Here
          </a>
        </div>
      </div>


      <div
        className={cn(
          "select-none max-lg:hidden max-w-1/2",
          process.env.NODE_ENV === 'development' && "hidden" // unnecessary usage of computation power in dev.
        )}
      >
        <figure>
          <Matter />
        </figure>
      </div>
    </div>
  )
}
