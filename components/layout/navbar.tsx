'use client'
import { GithubLogoIcon, TwitterLogoIcon } from "@phosphor-icons/react/dist/ssr"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import { CommandIcon } from "@phosphor-icons/react"
import Image from "next/image"
import { useCommandPalette } from "@/lib/command-palette-context"

export const Navbar = () => {
  const { toggleOpen } = useCommandPalette()

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
            onClick={() => toggleOpen()}
            className="cursor-pointer p-1 mr-1 rounded-full text-white bg-white/5 backdrop-blur-sm" >
            <span className="flex justify-center items-center gap-1 text-[15px] px-1">
              <MagnifyingGlassIcon size={20} weight="bold" />
              <span className="hidden sm:flex sm:items-center sm:justify-center"><CommandIcon size={19} />K</span>
            </span>
          </span>

          <div className="hidden sm:block h-6 w-px bg-white/20" />

          <span className="cursor-pointer p-1 rounded-lg group">
            <a
              href="https://github.com/Netmods/Drapes-ui"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubLogoIcon size={25} className="group-hover:scale-105 transition-all ease-linear duration-75" />
            </a>
          </span>

          <span className="cursor-pointer p-1 rounded-lg group">
            <a
              href={""}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TwitterLogoIcon size={25} className="group-hover:scale-105 transition-all ease-linear duration-75" />
            </a>
          </span>
        </div>
      </div>
    </div >
  )
}
