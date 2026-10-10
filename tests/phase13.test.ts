import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright-core";

const CHROMIUM_PATH = path.join(
  process.env.HOME || "/home/faiz",
  ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const VIEWPORTS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1536];

async function runPhase13TestSuite() {
  console.log("=================================================");
  console.log("Running PHASE 13 Mobile Overlay, Login, Contact & Reviews Suite");
  console.log("Tool: Playwright-core (Chromium 1243)");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: Static Repo Scan - Zero Demo Credentials in src/, README.md, TRACKER.md
  // -------------------------------------------------------------
  console.log("--- Test Suite 1: Repo Scan for Demo Credentials ---");
  const bannedCredentials = [
    "Admin@123456",
    "Customer@123456",
    "priya@example.com",
    "admin@samaura.com",
  ];

  function searchDir(dir: string, matches: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", ".git", ".next", "dist"].includes(entry.name)) {
          searchDir(fullPath, matches);
        }
      } else if (entry.isFile()) {
        const content = fs.readFileSync(fullPath, "utf8");
        for (const cred of bannedCredentials) {
          if (content.includes(cred)) {
            matches.push(`${fullPath} contains ${cred}`);
          }
        }
      }
    }
  }

  const foundInSrc: string[] = [];
  searchDir(path.join(process.cwd(), "src"), foundInSrc);
  assert(foundInSrc.length === 0, `No banned demo credentials in src/ (found: ${foundInSrc.length})`);

  const readmeContent = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");
  for (const cred of bannedCredentials) {
    assert(!readmeContent.includes(cred), `README.md does not contain '${cred}'`);
  }

  const trackerContent = fs.readFileSync(path.join(process.cwd(), "TRACKER.md"), "utf8");
  for (const cred of bannedCredentials) {
    assert(!trackerContent.includes(cred), `TRACKER.md does not contain '${cred}'`);
  }

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // TEST SUITE 2: Mobile Menu Overlay (Does NOT push content)
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 2: Mobile Menu Overlay Non-Pushing & Interactivity ---");
    const mobileWidths = [320, 375, 414];
    const testPages = ["/", "/shop", "/product/samaura-menstrual-cup"];

    for (const width of mobileWidths) {
      for (const urlPath of testPages) {
        const context = await browser.newContext({
          viewport: { width, height: 750 },
          isMobile: true,
          hasTouch: true,
        });
        const page = await context.newPage();
        await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(300);

        // Target content element (main content)
        const mainSelector = "main";
        const beforeRect = await page.$eval(mainSelector, (el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, left: r.left, width: r.width };
        });
        const beforeScrollY = await page.evaluate(() => window.scrollY);

        // Click hamburger toggle to open
        const menuToggle = page.locator('header button[aria-label="Toggle Navigation Menu"]');
        await menuToggle.click();
        await page.waitForTimeout(250);

        // Verify overlay is open and body scroll is locked
        const isBodyLocked = await page.evaluate(() => document.body.style.overflow === "hidden");
        assert(isBodyLocked, `Body scroll locked when menu is open (${width}px on ${urlPath})`);

        // Check main content top position & scrollY (diff must be 0)
        const afterRect = await page.$eval(mainSelector, (el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, left: r.left, width: r.width };
        });
        const afterScrollY = await page.evaluate(() => window.scrollY);

        const topDiff = Math.abs(afterRect.top - beforeRect.top);
        const scrollDiff = Math.abs(afterScrollY - beforeScrollY);
        assert(topDiff === 0, `Page content did NOT shift top position (diff: ${topDiff}px at ${width}px on ${urlPath})`);
        assert(scrollDiff === 0, `window.scrollY unchanged (diff: ${scrollDiff}px at ${width}px on ${urlPath})`);

        // Verify header icons remain clickable via elementFromPoint
        const iconsClickable = await page.evaluate(() => {
          const selectors = [
            'header button[aria-label="Toggle Navigation Menu"]',
            'header a[href="/"]',
            'header button[aria-label="Search products"]',
            'header a[aria-label="My Account"]',
            'header button[aria-label="View Shopping Cart"]',
          ];
          for (const sel of selectors) {
            const ctrl = document.querySelector(sel);
            if (!ctrl) continue;
            const rect = ctrl.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const topEl = document.elementFromPoint(cx, cy);
            if (!ctrl.contains(topEl) && topEl !== ctrl) {
              return false;
            }
          }
          return true;
        });
        assert(iconsClickable, `Header controls uncoverable by overlay (${width}px on ${urlPath})`);

        // Test close paths on first page
        if (urlPath === "/" && width === 375) {
          // Close via backdrop tap
          const backdrop = page.locator(".z-drawer-backdrop");
          await backdrop.dispatchEvent("click");
          await page.waitForTimeout(250);
          let bodyUnlocked = await page.evaluate(() => document.body.style.overflow === "");
          assert(bodyUnlocked, "Body scroll lock unlocked after backdrop tap");

          // Re-open and close via Esc key
          await menuToggle.click();
          await page.waitForTimeout(250);
          await page.keyboard.press("Escape");
          await page.waitForTimeout(250);
          bodyUnlocked = await page.evaluate(() => document.body.style.overflow === "");
          assert(bodyUnlocked, "Body scroll lock unlocked after Esc key");

          // Check focus returned to toggle button
          const isFocusOnToggle = await page.evaluate(() => {
            const toggle = document.querySelector('header button[aria-label="Toggle Navigation Menu"]');
            return document.activeElement === toggle;
          });
          assert(isFocusOnToggle, "Focus returned to toggle button after Esc close");

          // Re-open and close via route change
          await menuToggle.click();
          await page.waitForTimeout(250);
          const shopLink = page.locator('div[role="dialog"] a[href="/shop"]');
          await shopLink.click();
          await page.waitForURL("**/shop");
          await page.waitForTimeout(250);
          bodyUnlocked = await page.evaluate(() => document.body.style.overflow === "");
          assert(bodyUnlocked, "Body scroll lock unlocked after route change");
        }

        await context.close();
      }
    }

    // -------------------------------------------------------------
    // TEST SUITE 3: /login Cleanup Verification
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 3: /login Cleanup Verification ---");
    const loginContext = await browser.newContext({ viewport: { width: 375, height: 750 } });
    const loginPage = await loginContext.newPage();
    await loginPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await loginPage.waitForTimeout(300);

    const loginText = await loginPage.textContent("body");
    assert(!loginText?.includes("Quick Demo Sign-In"), "/login has no 'Quick Demo Sign-In' block");
    assert(!loginText?.includes("Demo Customer"), "/login has no 'Demo Customer' button");
    assert(!loginText?.includes("Demo Admin"), "/login has no 'Demo Admin' button");
    assert(!loginText?.includes("Samaura Account"), "/login has no 'Samaura Account' badge");

    const h1Text = await loginPage.locator("h1").textContent();
    assert(h1Text?.trim() === "Sign in", `H1 is sentence case 'Sign in' (got: '${h1Text?.trim()}')`);

    const hasEmail = (await loginPage.locator('input[type="email"]').count()) > 0;
    const hasPassword = (await loginPage.locator('input[type="password"], input[type="text"]#login-password').count()) > 0;
    const hasSignInBtn = (await loginPage.locator('button:has-text("Sign in")').count()) > 0;
    const hasCreateAcc = (await loginPage.locator('a[href="/register"]').count()) > 0;
    const hasGuest = (await loginPage.locator('a:has-text("Continue as guest")').count()) > 0;

    assert(hasEmail, "Email input present");
    assert(hasPassword, "Password input present");
    assert(hasSignInBtn, "Primary 'Sign in' button present");
    assert(hasCreateAcc, "'Create an account' link present");
    assert(hasGuest, "'Continue as guest' link present");

    // Test password show/hide toggle
    const togglePassBtn = loginPage.locator('button[aria-label*="password"]');
    assert((await togglePassBtn.count()) > 0, "Password show/hide toggle button present");
    await togglePassBtn.click();
    const passInputType = await loginPage.locator("#login-password").getAttribute("type");
    assert(passInputType === "text", "Password input type changed to text on toggle");
    await togglePassBtn.click();
    const passInputTypeAfter = await loginPage.locator("#login-password").getAttribute("type");
    assert(passInputTypeAfter === "password", "Password input type restored to password on toggle");

    await loginContext.close();

    // -------------------------------------------------------------
    // TEST SUITE 4: /contact Redesign Verification
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 4: /contact Redesign Verification ---");
    const contactContext = await browser.newContext({ viewport: { width: 1024, height: 800 } });
    const contactPage = await contactContext.newPage();
    await contactPage.goto(`${BASE_URL}/contact?topic=awareness`, { waitUntil: "domcontentloaded" });
    await contactPage.waitForTimeout(300);

    const contactH1 = await contactPage.locator("h1").textContent();
    assert(contactH1?.trim() === "Contact us", `H1 is 'Contact us' (got: '${contactH1?.trim()}')`);

    // Verify topic prefill
    const selectedTopic = await contactPage.locator("select#contact-topic").inputValue();
    assert(
      selectedTopic.toLowerCase().includes("awareness"),
      `Topic prefill ?topic=awareness works (selected: '${selectedTopic}')`
    );

    // Verify no badges or pills
    const badgeCount = await contactPage.locator(".badge, .pill, [class*='badge']").count();
    assert(badgeCount === 0, `No badge or pill elements on /contact (count: ${badgeCount})`);

    // Verify 44px min-height on inputs
    const inputHeights = await contactPage.$$eval(
      "#contact-name, #contact-email, #contact-phone, select#contact-topic, button[type='submit']",
      (elements) => elements.map((el) => el.getBoundingClientRect().height >= 43.5)
    );
    assert(inputHeights.every(Boolean), "All form interactive elements satisfy 44px min-height");

    // Fill and submit form
    await contactPage.fill("#contact-name", "Test User");
    await contactPage.fill("#contact-email", "testuser@example.com");
    await contactPage.fill("#contact-message", "This is a test enquiry for verification purposes.");
    await contactPage.click("button[type='submit']");
    await contactPage.waitForTimeout(1000);

    const successHeading = await contactPage
      .locator('h2:has-text("Thanks, we have received your message.")')
      .textContent();
    assert(
      Boolean(successHeading?.includes("Thanks, we have received your message.")),
      `Success state replaces form ('${successHeading?.trim()}')`
    );

    await contactContext.close();

    // -------------------------------------------------------------
    // TEST SUITE 5: Product Reviews Minimal UI Verification
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 5: Product Reviews UI & Moderation Verification ---");
    const prodContext = await browser.newContext({ viewport: { width: 375, height: 750 } });
    const prodPage = await prodContext.newPage();
    await prodPage.goto(`${BASE_URL}/product/samaura-menstrual-cup`, { waitUntil: "domcontentloaded" });
    await prodPage.waitForTimeout(400);

    const prodPageText = await prodPage.textContent("#reviews");
    assert(!prodPageText?.includes("Order-linked"), "No 'Order-linked' banned phrase");
    assert(!prodPageText?.includes("Honest community"), "No 'Honest community' banned phrase");
    assert(!prodPageText?.includes("Takes ~60"), "No 'Takes ~60' banned phrase");
    assert(!prodPageText?.includes("First Impressions"), "No 'First Impressions' badge");

    // Click 'Write a review'
    const writeReviewBtn = prodPage.locator('#reviews button:has-text("Write a review")');
    if ((await writeReviewBtn.count()) > 0) {
      await writeReviewBtn.click();
      await prodPage.waitForTimeout(200);

      // Verify accessible star radiogroup
      const radiogroup = prodPage.locator('#reviews [role="radiogroup"]');
      assert((await radiogroup.count()) > 0, "Rating accessible radio group present");

      // Verify live counter
      const liveCounterBefore = await prodPage.locator('#reviews:has-text("/ 1000 characters")').count();
      assert(liveCounterBefore > 0, "Live character counter present");

      // Fill and submit
      const uniqueName = `Reviewer_${Date.now()}`;
      await prodPage.fill("#review-name", uniqueName);
      await prodPage.fill("#review-text", "This is a verified test product review with plenty of characters.");
      await prodPage.click('#reviews button:has-text("Submit review")');
      await prodPage.waitForTimeout(1000);

      const submitConfirmation = await prodPage.textContent("#reviews");
      assert(
        Boolean(submitConfirmation?.includes("Thanks. Your review will appear after it has been checked.")),
        "Submission success message displayed"
      );

      // Verify the pending review is NOT visible in public reviews list
      const publishedText = await prodPage.textContent("#reviews");
      assert(!publishedText?.includes(uniqueName), "Pending review is not visible publicly before approval");
    }

    await prodContext.close();

    // -------------------------------------------------------------
    // TEST SUITE 6: Zero Horizontal Overflow across 9 Viewports
    // -------------------------------------------------------------
    console.log("\n--- Test Suite 6: Horizontal Overflow Across 9 Viewports ---");
    const auditPages = ["/", "/login", "/contact", "/product/samaura-menstrual-cup"];

    for (const width of VIEWPORTS) {
      const vContext = await browser.newContext({
        viewport: { width, height: 800 },
        isMobile: width < 768,
      });
      const vPage = await vContext.newPage();

      for (const p of auditPages) {
        await vPage.goto(`${BASE_URL}${p}`, { waitUntil: "domcontentloaded" });
        await vPage.waitForTimeout(200);

        const overflow = await vPage.evaluate(() => {
          const docEl = document.documentElement;
          return {
            scrollLeft: docEl.scrollLeft || window.scrollX,
            scrollWidth: docEl.scrollWidth,
            clientWidth: docEl.clientWidth,
          };
        });

        const hasNoOverflow = overflow.scrollLeft === 0 && overflow.scrollWidth <= overflow.clientWidth + 1;
        assert(
          hasNoOverflow,
          `No overflow at ${width}px on ${p} (scrollWidth: ${overflow.scrollWidth}, clientWidth: ${overflow.clientWidth})`
        );
      }
      await vContext.close();
    }
  } finally {
    await browser.close();
  }

  console.log("\n=================================================");
  console.log(`PHASE 13 TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase13TestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
