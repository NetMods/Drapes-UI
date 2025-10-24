import { GithubLogoIcon, TwitterLogoIcon } from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"

export const Navbar = () => {
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
          <span className="cursor-pointer p-1 rounded-lg group">
            <a href="#"> <GithubLogoIcon size={25} className="group-hover:scale-105 transition-all ease-linear duration-75" /> </a>
          </span>

          <span className="cursor-pointer p-1 rounded-lg group">
            <a href="#"> <TwitterLogoIcon size={25} className="group-hover:scale-105 transition-all ease-linear duration-75" /> </a>
          </span>
        </div>

      </div>
    </div>
  )
}
