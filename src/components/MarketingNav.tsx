import Link from "next/link";
import Logo from "./Logo";

const LINKS = [["How it works", "/#how"], ["Compare", "/#compare"], ["FAQ", "/#faq"]] as const;

/** Landing-page navbar: deliberately minimal. The app itself lives behind "Launch App" with a sidebar. */
export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <Logo size={36} />
          Privora
        </Link>
        <nav className="ml-6 hidden gap-1 text-sm md:flex">
          {LINKS.map(([t, h]) => <a key={t} href={h} className="rounded-none px-3.5 py-2 text-muted transition hover:bg-card2 hover:text-fg">{t}</a>)}
        </nav>
        <Link href="/swap" className="ml-auto rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/30 transition hover:brightness-110 active:scale-[.98]">Launch App</Link>
      </div>
    </header>
  );
}
