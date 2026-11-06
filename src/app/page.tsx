import SwapCard from "@/components/swap/SwapCard";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Swap privately.<br /><span className="text-accent">Read anonymously.</span></h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">The real Uniswap V2 contracts, with every balance, allowance, reserve and quote read through Anon-RPC instead of straight from your IP.</p>
      </div>
      <SwapCard />
    </div>
  );
}
