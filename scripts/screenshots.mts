// Regenerates the README screenshots in docs/images from the running production build.
//   npm run build && npm start   (other terminal)   then   npm run shots
import { launch } from "./lib/cdp.mts";

const BASE = process.env.BASE ?? "http://127.0.0.1:3200";
const OUT = "docs/images";
const READY = "document.body.innerText.includes('reads are anonymised')";

const shot = async (name: string, w: number, h: number, flow: (p: Awaited<ReturnType<typeof launch>>) => Promise<void>) => {
  const p = await launch({ width: w, height: h });
  try {
    await p.goto(BASE);
    await p.waitFor("Object.keys(document.querySelector('a,button')).some(k=>k.startsWith('__react'))", 30000, "hydration");
    await p.waitFor(READY, 120000, "Anon-RPC worker ready");
    await flow(p);
    await new Promise((r) => setTimeout(r, 800));
    await p.screenshot(`${OUT}/${name}.png`);
    console.log(`  saved ${OUT}/${name}.png`);
  } finally { await p.close(); }
};

await shot("home", 1280, 1000, async () => {});
await shot("pools", 1280, 1000, async (p) => {
  await p.click("Pools");
  await p.waitFor("document.body.innerText.includes('Reserve ')", 120000, "pools loaded");
});
await shot("privacy-center", 1280, 1250, async (p) => {
  await p.click("Pools");
  await p.waitFor("document.body.innerText.includes('Reserve ')", 120000, "pools loaded");
  await p.click("Privacy Center");
  await p.waitFor("Number(document.querySelector('[data-stat=\"anon-ok\"]')?.textContent) > 0", 20000, "anonymised reads counted");
});
await shot("liquidity", 1280, 760, async (p) => { await p.click("Liquidity"); await p.waitFor("document.body.innerText.includes('Add liquidity')", 20000); });
await shot("settings", 1280, 760, async (p) => { await p.click("Settings"); await p.waitFor("document.body.innerText.includes('Slippage tolerance')", 20000); });
await shot("flow", 1280, 900, async (p) => {
  await p.eval("document.evaluate(\"//h2[contains(., 'Where each request goes')]\", document, null, 9, null).singleNodeValue.scrollIntoView({block:'start'}); window.scrollBy(0,-40); true");
});
await shot("compare", 1280, 760, async (p) => {
  await p.eval("document.evaluate(\"//h2[contains(., 'A normal dapp vs. Privora')]\", document, null, 9, null).singleNodeValue.scrollIntoView({block:'start'}); window.scrollBy(0,-40); true");
});
await shot("mobile", 390, 900, async () => {});
