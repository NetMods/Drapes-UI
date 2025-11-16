'use client'
import { GithubLogoIcon, TwitterLogoIcon } from "@phosphor-icons/react/dist/ssr"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"
import { useCommandPalette } from "../ui/command-palette"


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
            className="cursor-pointer p-1 rounded-full text-white bg-white/5 hover:bg-white/10 border border-white/10 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <span className="flex justify-center items-center gap-1 text-[15px] px-1">
              <MagnifyingGlassIcon size={18} className="hover:opacity-70" />
              <span className="hidden sm:block sm:hover:opacity-70">⌘K</span>
            </span>
          </span>


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
