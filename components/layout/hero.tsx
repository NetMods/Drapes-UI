'use client'
import { GithubLogoIcon } from "@phosphor-icons/react"

export const HeroSection = () => {
  return (
    <div className="flex justify-center text-base-content gap-40">
      <div className="my-auto">
        <p className="font-serif text-7xl">Ready to use <br /> lively backgrounds</p>
        <p className="mt-5 text-lg text-base-content/70 max-w-130">Made using Tailwind and JSX and easily integrate with your React JS and Next JS app.</p>

        <a className="inline-flex gap-2 items-center mt-5 border border-base-content/30 hover:bg-base-100/20 cursor-pointer p-2 rounded-xl hover:shadow-lg bg-base-content/10 transition-all ease-linear">
          <GithubLogoIcon size={20} />
          Contribute Here
        </a>
      </div>

      <div>
        <figure>
          <div className="size-150 bg-base-content/10 rounded-xl" />
        </figure>
      </div>
    </div>
  )
}
