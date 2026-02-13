import Image from "next/image";
import Link from "next/link";
import HomeSearchBar from './components/homesearchbar';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-white">
      {/* Header - Mobile responsive padding */}
      <header className="flex items-center justify-end p-4 sm:p-6">
        {/* signin route */}
        <Link
          href="/signin"
          className="bg-black text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Sign in
        </Link>
      </header>

      {/* Main Content - Mobile responsive */}
      <main className="flex flex-col items-center justify-start px-4 sm:px-6 pt-8 sm:pt-16 md:pt-20">
        {/* Mobile responsive sizing */}
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

        {/* HomeSearchBar component with suggestions */}
        <HomeSearchBar />
      </main>
    </div>
  );
}