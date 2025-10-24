import { StarIcon } from "@phosphor-icons/react/dist/ssr"

export const Collections = () => {
  const backgrounds = [
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } }
  ]

  return (
    <div className="flex flex-col items-center text-base-content w-full">
      <span className="text-4xl font-serif">Our Collections</span>
      <div className="w-full grid max-sm:grid-cols-1 grid-cols-2 xl:grid-cols-3 mt-5 gap-5 wrap-break-word md:px-10">
        {backgrounds.map((item, index) => (
          <div
            className={`relative w-full h-96 overflow-hidden ${index % 2 === 0 ? 'justify-self-end' : 'justify-self-start'}`}
            key={index}
          >
            <div className={`size-full bg-base-content/20 rounded-2xl group border border-white/20`} >
              {item.component}
              <div className="group-hover:-translate-y-28 p-2 border-t border-white/20 w-full transition-all ease-linear absolute top-100">
                <span className="font-serif text-3xl italic">{item.name}</span>
                <div className="pt-2 space-x-2">
                  <button className="inline-flex px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear">
                    Preview
                  </button>
                  <button className="inline-flex px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear">
                    Code
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 m-2 p-2 rounded-xl cursor-pointer bg-base-content/20 group">
              <StarIcon className="group-hover:text-yellow-500 transition-colors ease-linear" weight="fill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
