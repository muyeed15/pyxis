import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* Header - Mobile responsive padding */}
      <header className="flex items-center justify-end p-4 sm:p-6">
        <button className="bg-black text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          Sign in
        </button>
      </header>

      {/* Main Content - Mobile responsive */}
      <main className="flex flex-col items-center justify-start px-4 sm:px-6 pt-8 sm:pt-16 md:pt-20">
        {/* Logo - Mobile responsive sizing */}
        <div className="mb-6 sm:mb-10">
          <Image
            src="/images/pyxis.svg"
            alt="Pyxis Search"
            width={280}
            height={95}
            priority
            className="w-[240px] h-auto sm:w-[280px]"
          />
        </div>

        {/* Search Container - Mobile responsive width and layout */}
        <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl">
          {/* Search Bar with Button - Always horizontal, button on right */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <input
              type="text"
              className="flex-1 px-4 py-3 sm:px-6 sm:py-3.5 border border-gray-300 rounded-full focus:outline-none focus:border-black text-base bg-white text-black placeholder-gray-500"
              placeholder="Search Pyxis"
            />

            {/* Search Button with Icon - Always on right side */}
            <button className="flex items-center justify-center bg-black text-white rounded-full hover:opacity-90 transition-opacity w-12 h-12 sm:w-14 sm:h-14">
              {/* Search Icon SVG - Make sure you have search.svg in public/images/ */}
              <Image
                src="/images/search.svg"
                alt="Search"
                width={24}
                height={24}
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}