import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr"

export const HeroSection = () => {
  return (
    <div className="flex justify-center text-base-content gap-10 px-10 min-[1250px]:gap-40">
      <div className="my-auto">
        <p className="font-serif max-md:text-center text-5xl max-md:leading-14 md:text-7xl">Ready to use <br /> lively backgrounds</p>
        <p className="mt-5 text-lg max-md:text-center text-base-content/70 max-w-130">Independent components made using Tailwind and JSX that can easily integrate with your React JS and Next JS app.</p>

        <div className="w-full mt-5 flex max-md:justify-center">
          <a className="inline-flex gap-2 items-center border border-base-content/30 hover:bg-base-100/20 cursor-pointer p-2 rounded-xl hover:shadow-lg bg-base-content/10 transition-all ease-linear">
            <GithubLogoIcon size={20} />
            Contribute Here
          </a>
        </div>
      </div>

      <div className="max-lg:hidden max-w-1/2">
        <figure>
          <div className="size-150 bg-base-content/10 rounded-xl" />
        </figure>
      </div>
    </div>
  )
}
