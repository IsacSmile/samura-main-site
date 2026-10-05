import { chromium } from "playwright-core";

const executablePath =
  "/home/faiz/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";

const VIEWPORTS = [320, 375, 414, 768, 1024, 1280, 1536];

const ROUTES = [
  { name: "/", url: "http://localhost:3000/" },
  { name: "/shop", url: "http://localhost:3000/shop" },
  { name: "/category/[slug]", url: "http://localhost:3000/category/sanitary-pads" },
  { name: "/product/[slug]", url: "http://localhost:3000/product/organic-cotton-ultra-thin-day-pads" },
  { name: "/login", url: "http://localhost:3000/login" },
  { name: "/admin", url: "http://localhost:3000/admin" },
];

async function run() {
  console.log("Launching Chromium from:", executablePath);
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // First, log in as admin to test /admin in an authenticated state
  console.log("Authenticating as admin...");
  await page.goto("http://localhost:3000/login");
  await page.fill('input[type="email"]', "admin@samaura.com");
  await page.fill('input[type="password"]', "Admin@123456");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  const results = [];

  for (const route of ROUTES) {
    const routeResults = { route: route.name, widths: {} };
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route.url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);

      const check = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const delta = docWidth - winWidth;
        let overflowingElements = [];
        if (delta > 0) {
          const all = document.querySelectorAll("*");
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1) {
              overflowingElements.push({
                tag: el.tagName,
                id: el.id,
                className: typeof el.className === "string" ? el.className.slice(0, 100) : "",
                right: rect.right,
              });
            }
          }
        }
        return {
          scrollWidth: docWidth,
          innerWidth: winWidth,
          isMatch: docWidth === winWidth,
          delta,
          overflowingElements: overflowingElements.slice(0, 5),
        };
      });

      routeResults.widths[width] = check;
      if (!check.isMatch) {
        console.warn(
          `[FAIL] ${route.name} at ${width}px: scrollWidth=${check.scrollWidth}, innerWidth=${check.innerWidth}, delta=${check.delta}`,
          check.overflowingElements
        );
      } else {
        console.log(`[PASS] ${route.name} at ${width}px (scrollWidth === innerWidth: ${check.innerWidth})`);
      }
    }
    results.push(routeResults);
  }

  await browser.close();

  console.log("\n=== SUMMARY TABLE ===");
  const headers = ["Route", ...VIEWPORTS.map((w) => `${w}px`)];
  console.log(headers.join(" | "));
  console.log(headers.map(() => "---").join(" | "));

  for (const r of results) {
    const row = [
      r.route,
      ...VIEWPORTS.map((w) => {
        const c = r.widths[w];
        return c.isMatch ? `PASS (${c.innerWidth}px)` : `FAIL (${c.scrollWidth}/${c.innerWidth})`;
      }),
    ];
    console.log(row.join(" | "));
  }
}

run().catch((err) => {
  console.error("Error during verification:", err);
  process.exit(1);
});
