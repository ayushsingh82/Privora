// Regenerates the README screenshots in docs/images from the running production build.
//   npm run build && npm start   (other terminal)   then   npm run shots
import { launch } from "./lib/cdp.mts";

const BASE = process.env.BASE ?? "http://127.0.0.1:3200";
const OUT = "docs/images";
const READY = "document.body.innerText.includes('reads are anonymised')";

const shot = async (name: string, w: number, h: number, flow: (p: Awaited<ReturnType<typeof launch>>) => Promise<void>, start = "/swap") => {
  const p = await launch({ width: w, height: h });
  try {
    await p.goto(BASE + start);
    await p.waitFor("Object.keys(document.querySelector('a,button')).some(k=>k.startsWith('__react'))", 30000, "hydration");
    if (start !== "/") await p.waitFor("document.body.innerText.includes('reads are anonymised')", 120000, "Anon-RPC worker ready");
    await flow(p);
    await new Promise((r) => setTimeout(r, 800));
    await p.screenshot(`${OUT}/${name}.png`);
    console.log(`  saved ${OUT}/${name}.png`);
  } finally { await p.close(); }
};

await shot("home", 1280, 900, async () => {}, "/");
await shot("swap", 1280, 900, async () => {});
await shot("swap-quote", 1280, 900, async (p) => {
  await p.goto(`${BASE}/swap?from=0x174F4259E885EBaFcDc6c09f38a493c4CA90b85e&to=0x832262D88e6C02A31C7C267B6536cFafe7Fdf3E8`);
  await p.waitFor("document.querySelector('input[inputmode=decimal]')", 30000, "swap input");
  await p.waitFor(READY, 120000, "worker ready");
  await p.waitFor("![...document.querySelectorAll('button')].some(b=>b.textContent.includes('Select token'))", 120000, "tokens resolved");
  await p.type("input[inputmode=decimal]", "0.5");
  await p.waitFor("document.body.innerText.includes('Minimum received')", 120000, "quote");
  await p.waitFor("!document.body.innerText.includes('calculating')", 60000, "price impact").catch(() => {});
});
await shot("pools", 1280, 1000, async (p) => {
  await p.click("Pools");
  await p.waitFor("document.body.innerText.toLowerCase().includes('lp supply')", 120000, "pools loaded");
});
await shot("privacy-center", 1280, 1250, async (p) => {
  await p.click("Pools");
  await p.waitFor("document.body.innerText.toLowerCase().includes('lp supply')", 120000, "pools loaded");
  await p.click("Privacy");
  await p.waitFor("Number(document.querySelector('[data-stat=\"anon-ok\"]')?.textContent) > 0", 20000, "anonymised reads counted");
});
await shot("liquidity", 1280, 760, async (p) => { await p.click("Liquidity"); await p.waitFor("document.body.innerText.includes('Add liquidity')", 20000); });
await shot("settings", 1280, 760, async (p) => { await p.click("Settings"); await p.waitFor("document.body.innerText.includes('Slippage tolerance')", 20000); });
await shot("flow", 1280, 900, async (p) => {
  await p.eval("document.evaluate(\"//h2[contains(., 'Where each request goes')]\", document, null, 9, null).singleNodeValue.scrollIntoView({block:'start',behavior:'instant'}); window.scrollBy({top:-110,behavior:'instant'}); true");
}, "/");
await shot("compare", 1280, 760, async (p) => {
  await p.eval("document.evaluate(\"//h2[contains(., 'What changes for your IP')]\", document, null, 9, null).singleNodeValue.scrollIntoView({block:'start',behavior:'instant'}); window.scrollBy({top:-110,behavior:'instant'}); true");
}, "/");
await shot("mobile", 390, 900, async () => {}, "/");
await shot("mobile-app", 390, 900, async () => {});
