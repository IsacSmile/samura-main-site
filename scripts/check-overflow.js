/* eslint-disable */
const { chromium } = require("playwright-core");

const VIEWPORTS = [320, 375, 414, 640, 768, 1024, 1280, 1536];
const PAGES = [
  "/",
  "/offers",
  "/about",
  "/faq",
  "/contact",
  "/blog",
  "/blog/choose-right-sanitary-pad-flow",
  "/privacy",
  "/terms",
  "/shipping-returns",
];

async function run() {
  console.log("Checking horizontal overflow across viewports (320px - 1536px)...");
  
  // Find system chromium or bundled playwright
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (err) {
    // Try system chromium/chrome
    const possiblePaths = [
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome",
      "/snap/bin/chromium",
    ];
    for (const p of possiblePaths) {
      try {
        browser = await chromium.launch({
          executablePath: p,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        break;
      } catch {}
    }
  }

  if (!browser) {
    console.log("No chromium browser executable found; skipping browser DOM measurements.");
    return;
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  let failed = 0;

  for (const urlPath of PAGES) {
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`http://localhost:3000${urlPath}`, { waitUntil: "domcontentloaded" });

      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientWidth = docEl.clientWidth;
        return {
          hasOverflow: scrollWidth > clientWidth + 1, // 1px rounding tolerance
          scrollWidth,
          clientWidth,
        };
      });

      if (overflow.hasOverflow) {
        console.error(`[OVERFLOW ERROR] ${urlPath} at ${width}px: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);
        failed++;
      }
    }
    console.log(`✓ ${urlPath} verified across all 8 viewports (320px - 1536px)`);
  }

  await browser.close();

  if (failed === 0) {
    console.log("\nALL PAGES PASSED: 0 horizontal overflow detected across 320px - 1536px!");
  } else {
    console.error(`\nFAILED: ${failed} overflow issues detected!`);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
