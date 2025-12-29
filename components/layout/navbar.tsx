'use client'
import { GithubLogoIcon, TwitterLogoIcon } from "@phosphor-icons/react/dist/ssr"
import { MagnifyingGlassIcon, StarIcon } from "@phosphor-icons/react/dist/ssr"
import { CommandIcon } from "@phosphor-icons/react"
import Image from "next/image"
import { useCommandPalette } from "./command-palette/context"
import { useLayoutEffect, useState } from "react"
import { getGithubStar } from "@/lib/github"

export const Navbar = () => {
  const { toggleOpen } = useCommandPalette()
  const [starsCount, setStarsCount] = useState(0)

  useLayoutEffect(() => {
    getGithubStar("NetMods/Drapes-UI").then((res) => setStarsCount(res))
  }, [])

  const handleTwitterLink = () => {
    const profiles = ['https://x.com/Dharmeshwr', 'https://x.com/Monkey_d_aryan']
    const link = profiles[Math.floor(Math.random() * 2)]
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full text-white font-sans p-2 px-6 mt-4 rounded-full border border-white/20 shadow-xl backdrop-blur-3xl max-w-200 mx-auto select-none">
      <div className="flex justify-between text-md md:text-xl items-center">
        <div className="flex items-center justify-center gap-3 text-white">
          <Image
            src={"/logo-white.svg"}
            alt="logo"
            width={20}
            height={20}
          />
          Drapes UI
        </div>

        <div className="flex gap-1 items-center max-md:scale-95">
          <span
            onClick={toggleOpen}
            className="cursor-pointer max-sm:size-8 max-sm:inline-flex sm:p-1 justify-center items-center mr-1 rounded-lg text-white bg-white/5 backdrop-blur-sm" >
            <span className="flex justify-center items-center gap-1 text-[15px] px-1">
              <MagnifyingGlassIcon size={19} weight="bold" />
              <span className="hidden sm:flex sm:items-center sm:justify-center"><CommandIcon size={19} />K</span>
            </span>
          </span>

          <div className="hidden sm:block h-6 w-px bg-white/20" />

          <a
            href="https://github.com/Netmods/Drapes-ui"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className="cursor-pointer flex gap-1 p-1 justify-center items-center mx-1 rounded-lg text-white bg-white/5 backdrop-blur-sm text-[15px]"
            >
              {starsCount > 0 &&
                <>
                  <StarIcon size={15} weight="fill" className="ml-1" />
                  <span className="text-sm mr-1 mt-0.5 stars-value">{starsCount}</span>
                </>
              }
              <GithubLogoIcon size={22} className="shrink-0" weight="regular" />
            </span>
          </a>

          <div className="hidden sm:block h-6 w-px bg-white/20" />

          <span
            className="cursor-pointer p-1 rounded-lg group text-white bg-white/5 backdrop-blur-sm ml-1"
            onClick={handleTwitterLink}
          >
            <TwitterLogoIcon size={22} className="shrink-0" weight="regular" />
          </span>
        </div>
      </div>
    </div >
  )
}
