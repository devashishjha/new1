import Link from 'next/link';

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-black/50 to-transparent">
      <div className="container mx-auto flex items-center justify-center">
        <Link href="/reels">
          <h1 className="text-3xl font-black text-white tracking-tighter">LOKALITY</h1>
        </Link>
      </div>
    </header>
  );
}
