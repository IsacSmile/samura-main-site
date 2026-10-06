import { db } from "../index";
import {
  users,
  categories,
  products,
  productVariants,
  productImages,
  coupons,
  banners,
  posts,
  pages,
  settings,
  shippingRules,
} from "../schema";
import bcrypt from "bcryptjs";

export async function runSeed() {
  console.log("🌱 Seeding Samaura Healthcare database (Phase 1)...");

  // 1. Seed Admin User & (non-prod) Demo Customer
  console.log("1. Seeding Admin User...");
  if (process.env.NODE_ENV === "production") {
    if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
      throw new Error(
        "CRITICAL SECURITY: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables are required in production. No default passwords are permitted."
      );
    }
  }

  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ||
    (process.env.NODE_ENV !== "production" ? "admin@samaura.com" : "");
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ||
    (process.env.NODE_ENV !== "production" ? "Admin@123456" : "");

  if (!adminEmail || !adminPassword) {
    throw new Error("Admin email and password must not be empty.");
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const initialUsers: Array<typeof users.$inferInsert> = [
    {
      id: "usr_admin_001",
      name: "Samaura Admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "admin",
      phone: "9876543210",
      emailVerified: new Date(),
    },
  ];

  if (process.env.NODE_ENV !== "production") {
    console.log("   (Non-production environment detected: seeding demo customer Priya Sharma)...");
    const customerPasswordHash = await bcrypt.hash("Customer@123456", 10);
    initialUsers.push({
      id: "usr_customer_001",
      name: "Priya Sharma",
      email: "priya@example.com",
      passwordHash: customerPasswordHash,
      role: "customer",
      phone: "9811223344",
      emailVerified: new Date(),
    });
  }

  await db.insert(users).values(initialUsers).onConflictDoNothing();

  // 2. Seed 4 Categories
  console.log("2. Seeding 4 Categories...");
  const categoryData = [
    {
      id: "cat_sanitary_pads",
      name: "Sanitary Pads",
      slug: "sanitary-pads",
      description: "Soft pure cotton, gentle comfort, and absorbent pads for daytime and overnight flow.",
      image: "/products/day-pads.svg",
      sortOrder: 1,
    },
    {
      id: "cat_panty_liners",
      name: "Panty Liners",
      slug: "panty-liners",
      description: "Feather-light, breathable daily cotton liners for spotting, ovulation discharge, and cup backup.",
      image: "/products/daily-liners.svg",
      sortOrder: 2,
    },
    {
      id: "cat_menstrual_cups",
      name: "Menstrual Cups",
      slug: "menstrual-cups",
      description: "Flexible soft silicone cups offering comfortable, reusable day and night period freedom.",
      image: "/products/menstrual-cup.svg",
      sortOrder: 3,
    },
    {
      id: "cat_intimate_care",
      name: "Intimate Care",
      slug: "intimate-care",
      description: "pH 3.5 balanced washes, soothing cramp roll-ons, and delicate botanical care.",
      image: "/products/intimate-wash.svg",
      sortOrder: 4,
    },
  ];

  await db.insert(categories).values(categoryData).onConflictDoNothing();

  // 3. Seed 8 Demo Products with Variants & Images
  console.log("3. Seeding 8 Demo Products with Variants & Images...");
  const productList = [
    {
      id: "prod_01_organic_day_pads",
      categoryId: "cat_sanitary_pads",
      name: "Pure Cotton Ultra-Thin Day Pads",
      slug: "pure-cotton-ultra-thin-day-pads",
      shortDescription: "Ultra-thin daytime pads with soft pure cotton topsheet.",
      description:
        "Designed specifically for sensitive skin, Samaura Pure Cotton Day Pads eliminate plastic chafing and chemical irritation. Features a super-absorbent core that locks moisture in seconds, flexible wings that stay in place, and a breathable bottom film that prevents humidity build-up.",
      basePricePaise: 29900, // ₹299.00
      salePricePaise: 24900, // ₹249.00
      isFeatured: true,
      isBestseller: true,
      rating: 0,
      reviewCount: 0,
      badge: "Bestseller",
      flowType: "Regular to Moderate Flow",
      ingredients:
        "Pure Cotton (Topsheet), Chlorine-Free Elemental Wood Pulp (Absorbent Core), Super Absorbent Polymer (SAP), Plant-based Bioplastic Backing, Non-Toxic Adhesive.",
      absorptionGuide:
        "Absorbs up to 80ml. Ideal for regular to moderate daytime menstrual flow. Recommended change every 4–6 hours.",
      usageGuide:
        "1. Peel off the release paper from the back.\n2. Position the pad in the center of your underwear.\n3. Remove wing papers and wrap wings firmly underneath the panty gusset.\n4. Wrap used pad in wrapper and dispose in bin. Never flush.",
      features: JSON.stringify([
        "Soft Pure Cotton Topsheet",
        "Zero Chlorine, Fragrance or Synthetic Dyes",
        "Breathable backing helps prevent irritation",
        "Dual-core quick absorption channels",
      ]),
      faq: JSON.stringify([
        {
          q: "How often should I change this pad?",
          a: "Every 4 to 6 hours depending on your flow for optimal hygiene.",
        },
        {
          q: "Are these pads biodegradable?",
          a: "The pure cotton topsheet and plant cellulose core are biodegradable. Outer wrapper is recyclable.",
        },
      ]),
      variants: [
        {
          id: "var_01_day_12",
          name: "Pack of 12 (Regular 240mm)",
          sku: "SAM-PAD-DAY-12",
          size: "Regular (240mm)",
          packQty: 12,
          pricePaise: 29900,
          salePricePaise: 24900,
          stock: 85,
          isDefault: true,
          sortOrder: 1,
        },
        {
          id: "var_01_day_24",
          name: "Pack of 24 (XL 280mm)",
          sku: "SAM-PAD-DAY-24",
          size: "XL (280mm)",
          packQty: 24,
          pricePaise: 49900,
          salePricePaise: 42900,
          stock: 60,
          isDefault: false,
          sortOrder: 2,
        },
      ],
      image: "/products/day-pads.svg",
      gallery: ["/products/day-pads.svg", "/products/overnight-pads.svg"],
    },
    {
      id: "prod_02_overnight_xxl_pads",
      categoryId: "cat_sanitary_pads",
      name: "Overnight Heavy Flow Pads (XXL 320mm)",
      slug: "overnight-heavy-flow-pads-xxl",
      shortDescription: "Extra-long 320mm night pads with wide back flare and breathable comfort strip.",
      description:
        "Sleep comfortably through heavy nights. Samaura Overnight Pads feature a 320mm contoured shape with double-wide posterior wings that prevent back-leaks in all sleeping postures. Embedded breathable freshness strip helps maintain odor neutrality.",
      basePricePaise: 34900,
      salePricePaise: 29900,
      isFeatured: true,
      isBestseller: true,
      rating: 0,
      reviewCount: 0,
      badge: "Extra Coverage",
      flowType: "Heavy to Very Heavy Flow",
      ingredients:
        "Pure Cotton Topsheet, Breathable Freshness Strip, Super Absorbent Core with Japanese SAP, Breathable PE Film, Non-Toxic Adhesive.",
      absorptionGuide:
        "Absorbs up to 180ml. Designed for heavy flow, post-delivery, and uninterrupted 8-hour overnight sleep with 320mm wide rear coverage.",
      usageGuide:
        "1. Peel protective back strip.\n2. Align pad with the wider fan shape at the posterior (back) of underwear.\n3. Wrap both sets of wings securely underneath.\n4. Dispose thoughtfully in bin.",
      features: JSON.stringify([
        "320mm Extra-Long Profile with Wide Fan Back",
        "Natural Green Tea Freshness Strip",
        "Locks up to 180ml of fluid without feeling wet",
        "Super-soft cotton wings with secure grip adhesive",
      ]),
      faq: JSON.stringify([
        {
          q: "Will this stay in place while tossing in bed?",
          a: "Yes, our reinforced gentle adhesive holds securely across cotton underwear.",
        },
      ]),
      variants: [
        {
          id: "var_02_night_10",
          name: "Pack of 10 (XXL 320mm)",
          sku: "SAM-PAD-NGT-10",
          size: "XXL (320mm)",
          packQty: 10,
          pricePaise: 34900,
          salePricePaise: 29900,
          stock: 70,
          isDefault: true,
          sortOrder: 1,
        },
        {
          id: "var_02_night_20",
          name: "Pack of 20 (XXL 320mm)",
          sku: "SAM-PAD-NGT-20",
          size: "XXL (320mm)",
          packQty: 20,
          pricePaise: 64900,
          salePricePaise: 54900,
          stock: 40,
          isDefault: false,
          sortOrder: 2,
        },
      ],
      image: "/products/overnight-pads.svg",
      gallery: ["/products/overnight-pads.svg", "/products/day-pads.svg"],
    },
    {
      id: "prod_03_breathable_liners",
      categoryId: "cat_panty_liners",
      name: "Ultra-Soft Breathable Daily Panty Liners",
      slug: "ultra-soft-breathable-daily-panty-liners",
      shortDescription: "Ultra-thin 155mm breathable liners for daily discharge, spotting, and cup backup.",
      description:
        "Feel fresh all day long without feeling like you are wearing anything. Barely 1mm thin, our breathable cotton liners absorb daily discharge and sweat while keeping your delicate intimate area dry and fresh.",
      basePricePaise: 19900,
      salePricePaise: 16900,
      isFeatured: false,
      isBestseller: false,
      rating: 0,
      reviewCount: 0,
      badge: "Daily Fresh",
      flowType: "Light Spotting & Daily Discharge",
      ingredients:
        "Pure Cotton Surface, Air-Laid Micro-Porous Absorbent Core, Water-Proof Backsheet.",
      absorptionGuide:
        "Absorbs 15–20ml. Perfect for daily vaginal discharge, spotting, pre/post period days, or cup backup.",
      usageGuide:
        "1. Peel backing paper.\n2. Press firmly onto inside of underwear.\n3. Change every 3–5 hours as desired.",
      features: JSON.stringify([
        "155mm Curve-fit ergonomic shape",
        "Cotton-soft topsheet with micro-pores",
        "Odor-locking natural bamboo charcoal core",
      ]),
      faq: JSON.stringify([
        {
          q: "Are these safe for daily use?",
          a: "Yes, the breathable cotton backing prevents moisture build-up.",
        },
      ]),
      variants: [
        {
          id: "var_03_liner_30",
          name: "Pack of 30 Liners",
          sku: "SAM-LIN-30",
          size: "Standard 155mm",
          packQty: 30,
          pricePaise: 19900,
          salePricePaise: 16900,
          stock: 110,
          isDefault: true,
          sortOrder: 1,
        },
        {
          id: "var_03_liner_60",
          name: "Pack of 60 Liners (Value Box)",
          sku: "SAM-LIN-60",
          size: "Standard 155mm",
          packQty: 60,
          pricePaise: 34900,
          salePricePaise: 29900,
          stock: 65,
          isDefault: false,
          sortOrder: 2,
        },
      ],
      image: "/products/daily-liners.svg",
      gallery: ["/products/daily-liners.svg", "/products/curved-liners.svg"],
    },
    {
      id: "prod_04_curved_liners",
      categoryId: "cat_panty_liners",
      name: "Curved Flex Cotton Liners",
      slug: "curved-flex-cotton-liners",
      shortDescription: "Anatomically contoured 180mm cotton liners designed for active lifestyles and yoga.",
      description:
        "Active, flexible, and zero bunching. Specially curved to mirror your body's movements without shifting. Great for workouts, travel, and non-period discharge days.",
      basePricePaise: 22900,
      salePricePaise: 18900,
      isFeatured: false,
      isBestseller: false,
      rating: 0,
      reviewCount: 0,
      badge: "Active Fit",
      flowType: "Light Spotting & Daily Discharge",
      ingredients:
        "Pure Cotton Topsheet, Plant Cellulose Core, Breathable Back Film.",
      absorptionGuide:
        "Absorbs 25ml. Anatomical curve designed for active days, yoga, gym workouts, and contoured underwear.",
      usageGuide:
        "1. Remove adhesive strip.\n2. Affix along natural contour of sportswear or panties.\n3. Replace after workout or active day.",
      features: JSON.stringify([
        "Anatomically shaped side curvature",
        "Gentle adhesive that won't twist",
        "Formulated for breathable daily comfort",
      ]),
      faq: JSON.stringify([
        {
          q: "Does this shift during running or yoga?",
          a: "No, the dual-zone curve flexes with your movement.",
        },
      ]),
      variants: [
        {
          id: "var_04_curve_24",
          name: "Pack of 24 Curved Liners",
          sku: "SAM-CRV-24",
          size: "180mm Curved",
          packQty: 24,
          pricePaise: 22900,
          salePricePaise: 18900,
          stock: 55,
          isDefault: true,
          sortOrder: 1,
        },
      ],
      image: "/products/curved-liners.svg",
      gallery: ["/products/curved-liners.svg", "/products/daily-liners.svg"],
    },
    {
      id: "prod_05_menstrual_cup",
      categoryId: "cat_menstrual_cups",
      name: "Comfort Silicone Menstrual Cup",
      slug: "comfort-silicone-menstrual-cup",
      shortDescription: "Flexible silicone cup with ribbed stem and breathable storage pouch.",
      description:
        "Experience comfortable period care with Samaura's bell-shaped menstrual cup. Made from soft, flexible velvety silicone that folds easily and pops open gently. Offers dependable day and night protection.",
      basePricePaise: 49900,
      salePricePaise: 39900,
      isFeatured: true,
      isBestseller: true,
      rating: 0,
      reviewCount: 0,
      badge: "Popular Choice",
      flowType: "All Flows (Extended Wear)",
      ingredients:
        "Body-Safe Flexible Silicone. Crafted without BPA, latex, or phthalates.",
      absorptionGuide:
        "Holds up to 25ml (Size Small) / 30ml (Size Medium) / 35ml (Size Large). Extended wear comfort without changing.",
      usageGuide:
        "1. Sterilize in boiling water for 3–5 minutes before first use.\n2. Wash hands thoroughly and fold cup (C-Fold or Punch-Down Fold).\n3. Relax pelvic muscles and insert angled toward tailbone.\n4. Rotate gently to ensure full seal.\n5. Pinch base to release vacuum seal before removing.",
      features: JSON.stringify([
        "Flexible Body-Safe Silicone",
        "Velvety matte finish with easy-grip ribbed base",
        "Includes breathable cotton storage pouch",
        "Reusable and long-lasting",
      ]),
      faq: JSON.stringify([
        {
          q: "Which size should I pick?",
          a: "Small for under 25 or pre-childbirth; Large for 25+ or post vaginal childbirth.",
        },
      ]),
      variants: [
        {
          id: "var_05_cup_small",
          name: "Size Small (Under 25 / Pre-Childbirth)",
          sku: "SAM-CUP-S",
          size: "Small",
          packQty: 1,
          pricePaise: 49900,
          salePricePaise: 39900,
          stock: 45,
          isDefault: true,
          sortOrder: 1,
        },
        {
          id: "var_05_cup_large",
          name: "Size Large (25+ / Post-Childbirth)",
          sku: "SAM-CUP-L",
          size: "Large",
          packQty: 1,
          pricePaise: 49900,
          salePricePaise: 39900,
          stock: 40,
          isDefault: false,
          sortOrder: 2,
        },
      ],
      image: "/products/menstrual-cup.svg",
      gallery: ["/products/menstrual-cup.svg", "/products/cup-sterilizer.svg"],
    },
    {
      id: "prod_06_cup_sterilizer",
      categoryId: "cat_menstrual_cups",
      name: "Automatic Menstrual Cup Steam Sterilizer",
      slug: "automatic-menstrual-cup-steam-sterilizer",
      shortDescription: "Compact 3-minute rapid steam sterilizer that eliminates 99.9% of bacteria and germs.",
      description:
        "Sanitize your menstrual cup effortlessly without kitchen pots or microwave mess. Just add 5ml of water, place your cup, and press the single button. Auto-shuts off when sterilization is complete.",
      basePricePaise: 89900,
      salePricePaise: 74900,
      isFeatured: false,
      isBestseller: false,
      rating: 0,
      reviewCount: 0,
      badge: "Electric Steam",
      flowType: "Cup Hygiene & Care",
      ingredients:
        "High-grade BPA-free heat-resistant polypropylene, food-grade stainless steel heating plate.",
      absorptionGuide:
        "Rapid high-temperature steam sterilization cycle (3 minutes). Auto-shutoff safety sensor.",
      usageGuide:
        "1. Pour 5ml distilled water into the stainless steel reservoir.\n2. Place cup upright on the platform and close lid.\n3. Press power button. Steam cycle finishes in 3 minutes.\n4. Allow to cool before handling.",
      features: JSON.stringify([
        "3-Minute Express Steam Sterilization",
        "One-Touch Operation with Auto-Power Cut",
        "Discreet travel-friendly cylindrical design",
      ]),
      faq: JSON.stringify([
        {
          q: "Does this fit all cup sizes?",
          a: "Yes, it fits small, medium, and large cups across all major brands.",
        },
      ]),
      variants: [
        {
          id: "var_06_sterilizer_std",
          name: "Standard Electric Steam Unit (Blush White)",
          sku: "SAM-STER-WHT",
          size: "One Size",
          packQty: 1,
          pricePaise: 89900,
          salePricePaise: 74900,
          stock: 25,
          isDefault: true,
          sortOrder: 1,
        },
      ],
      image: "/products/cup-sterilizer.svg",
      gallery: ["/products/cup-sterilizer.svg", "/products/menstrual-cup.svg"],
    },
    {
      id: "prod_07_intimate_wash",
      categoryId: "cat_intimate_care",
      name: "Gentle Foaming Intimate Wash (pH 3.5)",
      slug: "gentle-foaming-intimate-wash-ph-3-5",
      shortDescription: "Soap-free, lactic acid foaming wash enriched with chamomile and aloe vera.",
      description:
        "Samaura Intimate Wash matches the natural acidic mantle (pH 3.5-4.0) with natural Lactic Acid, preventing itching, odor, and recurrent infections. Zero SLS, SLES, parabens, or artificial perfumes.",
      basePricePaise: 29900,
      salePricePaise: 25900,
      isFeatured: true,
      isBestseller: false,
      rating: 0,
      reviewCount: 0,
      badge: "pH 3.5 Balanced",
      flowType: "Daily Intimate Care",
      ingredients:
        "Aqua, Cocamidopropyl Betaine (Coconut derived), Lactic Acid (pH 3.5 regulator), Tea Tree Essential Oil, Calendula Extract, Aloe Vera Leaf Juice, Glycerin.",
      absorptionGuide:
        "pH 3.5 balanced formula. Maintains natural protective acidic vaginal microflora, preventing candida and bacterial vaginosis.",
      usageGuide:
        "1. Pump 1–2 clouds of foam onto clean palm.\n2. Gently cleanse external intimate area (vulva) from front to back.\n3. Rinse thoroughly with lukewarm water.\n4. For external use only. Use daily during shower.",
      features: JSON.stringify([
        "Natural Lactic Acid maintains healthy flora",
        "Infused with soothing Chamomile and Aloe Vera",
        "Formulated without parabens, SLS, or artificial fragrance",
      ]),
      faq: JSON.stringify([
        {
          q: "Can I use this daily?",
          a: "Yes, once daily during shower or bath.",
        },
      ]),
      variants: [
        {
          id: "var_07_wash_150",
          name: "150ml Foaming Pump Bottle",
          sku: "SAM-WASH-150",
          size: "150ml",
          packQty: 1,
          pricePaise: 29900,
          salePricePaise: 25900,
          stock: 80,
          isDefault: true,
          sortOrder: 1,
        },
        {
          id: "var_07_wash_twin",
          name: "Twin Pack (2 x 150ml)",
          sku: "SAM-WASH-2PK",
          size: "2x 150ml",
          packQty: 2,
          pricePaise: 54900,
          salePricePaise: 46900,
          stock: 35,
          isDefault: false,
          sortOrder: 2,
        },
      ],
      image: "/products/intimate-wash.svg",
      gallery: ["/products/intimate-wash.svg", "/products/cramp-rollon.svg"],
    },
    {
      id: "prod_08_cramp_rollon",
      categoryId: "cat_intimate_care",
      name: "Natural Period Cramp Relief Roll-On",
      slug: "natural-period-cramp-relief-roll-on",
      shortDescription: "Targeted essential oil roller with peppermint, wintergreen, and eucalyptus.",
      description:
        "Fast-acting, non-greasy roll-on formulated with pure essential oils that penetrate deeply into abdominal muscles, boosting micro-circulation and relieving menstrual spasms within 10 minutes.",
      basePricePaise: 29900,
      salePricePaise: 24900,
      isFeatured: false,
      isBestseller: false,
      rating: 0,
      reviewCount: 0,
      badge: "Herbal Blend",
      flowType: "Cramp Relief",
      ingredients:
        "Wintergreen Oil, Menthol, Eucalyptus Leaf Oil, Peppermint Essential Oil, Rosemary Oil, Lavender Oil, Caprylic/Capric Triglyceride (Coconut derived).",
      absorptionGuide:
        "Fast-acting topical transdermal relief. Calms uterine muscle spasms through gentle cooling-warming sensation within 10–15 minutes.",
      usageGuide:
        "1. Gently shake bottle.\n2. Glide roller ball across lower abdomen, lower back, and inner thighs.\n3. Massage gently with fingertips for 60 seconds.\n4. Reapply 3–4 times daily during cycle.",
      features: JSON.stringify([
        "Instant cooling & warming herbal sensation",
        "Non-sticky, rapid absorbing roller formulation",
        "Discreet, travel-friendly steel ball applicator",
      ]),
      faq: JSON.stringify([
        {
          q: "How many times can I apply this?",
          a: "Apply 3-4 times a day across lower abdomen and back.",
        },
      ]),
      variants: [
        {
          id: "var_08_cramp_10",
          name: "10ml Roll-on Bottle",
          sku: "SAM-CRMP-10",
          size: "10ml",
          packQty: 1,
          pricePaise: 29900,
          salePricePaise: 24900,
          stock: 60,
          isDefault: true,
          sortOrder: 1,
        },
        {
          id: "var_08_cramp_duo",
          name: "Duo Pack (2 x 10ml)",
          sku: "SAM-CRMP-DUO",
          size: "2x 10ml",
          packQty: 2,
          pricePaise: 54900,
          salePricePaise: 44900,
          stock: 30,
          isDefault: false,
          sortOrder: 2,
        },
      ],
      image: "/products/cramp-rollon.svg",
      gallery: ["/products/cramp-rollon.svg", "/products/intimate-wash.svg"],
    },
  ];

  for (const item of productList) {
    const { variants, image, gallery, ...prodData } = item;
    await db
      .insert(products)
      .values({
        ...prodData,
        faq: typeof prodData.faq === "string" ? prodData.faq : JSON.stringify(prodData.faq),
      })
      .onConflictDoNothing();

    for (const v of variants) {
      await db.insert(productVariants).values({
        ...v,
        productId: prodData.id,
      }).onConflictDoNothing();
    }

    if (image) {
      await db.insert(productImages).values({
        id: `img_${prodData.id}_primary`,
        productId: prodData.id,
        url: image,
        alt: prodData.name,
        isPrimary: true,
        sortOrder: 1,
      }).onConflictDoNothing();
    }

    if (gallery && Array.isArray(gallery)) {
      for (let i = 0; i < gallery.length; i++) {
        await db.insert(productImages).values({
          id: `img_${prodData.id}_gal_${i + 1}`,
          productId: prodData.id,
          url: gallery[i],
          alt: `${prodData.name} - View ${i + 1}`,
          isPrimary: i === 0,
          sortOrder: i + 1,
        }).onConflictDoNothing();
      }
    }
  }



  // 4. Seed 2 Coupons (Non-production only)
  if (process.env.NODE_ENV !== "production") {
    console.log("4. Seeding 2 Demo Coupons (WELCOME15, SAMAURA10)...");
    await db.insert(coupons).values([
      {
        id: "cpn_welcome15",
        code: "WELCOME15",
        discountType: "percentage",
        discountValue: 15, // 15%
        minOrderPaise: 49900, // min ₹499
        maxDiscountPaise: 15000, // max ₹150 off
        usageLimit: 1000,
        timesUsed: 14,
        isActive: true,
      },
      {
        id: "cpn_samaura10",
        code: "SAMAURA10",
        discountType: "percentage",
        discountValue: 10, // 10%
        minOrderPaise: 29900, // min ₹299
        maxDiscountPaise: 10000, // max ₹100 off
        usageLimit: 500,
        timesUsed: 28,
        isActive: true,
      },
    ]).onConflictDoNothing();
  } else {
    console.log("4. Production environment detected: skipping demo coupons.");
  }

  // 5. Seed Shipping Rules & Store Settings
  console.log("5. Seeding Shipping Rules & Store Settings...");
  await db.insert(shippingRules).values([
    {
      id: "ship_free_standard",
      name: "Free Shipping on Orders Above ₹499",
      minOrderPaise: 49900,
      maxOrderPaise: null,
      feePaise: 0,
      isDefault: true,
      isActive: true,
    },
    {
      id: "ship_flat_standard",
      name: "Standard Flat Shipping",
      minOrderPaise: 0,
      maxOrderPaise: 49899,
      feePaise: 5000, // ₹50.00
      isDefault: false,
      isActive: true,
    },
  ]).onConflictDoNothing();

  await db.insert(settings).values([
    {
      key: "shipping_free_threshold_paise",
      value: "49900",
      description: "Free shipping threshold in paise",
    },
    {
      key: "shipping_flat_fee_paise",
      value: "5000",
      description: "Standard delivery fee in paise",
    },
    {
      key: "cod_enabled",
      value: "true",
      description: "Cash on delivery availability",
    },
    {
      key: "cod_fee_paise",
      value: "3000",
      description: "COD handling fee in paise",
    },
    {
      key: "whatsapp_number",
      value: "+919876543210",
      description: "Customer support WhatsApp hotline",
    },
    {
      key: "contact_email",
      value: "care@samaura.com",
      description: "Store contact email",
    },
    {
      key: "contact_phone",
      value: "+91 98765 43210",
      description: "Store contact phone",
    },
    {
      key: "store_address",
      value: "No. 12, Wellness Avenue, HSR Layout, Bengaluru, Karnataka - 560102",
      description: "Store registered physical address",
    },
    {
      key: "seller_name",
      value: "Samaura Healthcare",
      description: "Legal seller entity name",
    },
    {
      key: "seller_gstin",
      value: "",
      description: "Seller GSTIN identifier",
    },
    {
      key: "show_gst_breakup",
      value: "false",
      description: "Show GST tax breakup on invoice",
    },
    {
      key: "cod_max_paise",
      value: "200000",
      description: "Max order total in paise for Cash on Delivery (₹2,000)",
    },
    {
      key: "medical_disclaimer",
      value: "Disclaimer: The content on this website is for educational and hygiene awareness purposes only and does not replace professional medical advice or clinical diagnosis. Always consult a qualified healthcare professional for medical concerns.",
      description: "Medical disclaimer text",
    },
    {
      key: "why_samaura_title",
      value: "Why Choose Samaura?",
      description: "Why Samaura section title",
    },
    {
      key: "why_samaura_content",
      value: "At Samaura, we believe menstrual care should be comfortable, respectful, and thoughtfully formulated. Our products prioritize pure cotton topsheets, breathable plant-derived cores, and neutral, unscented designs that respect the natural vaginal environment without chlorine bleaching or artificial perfumes.",
      description: "Why Samaura copy",
    },
    {
      key: "announcement_text",
      value: "✨ Free discreet shipping on all orders over ₹499 | Use code WELCOME15 for 15% off",
      description: "Announcement bar text",
    },
  ]).onConflictDoNothing();

  // 6. Seed Banners, Posts & Pages
  console.log("6. Seeding Banners, Blog Posts & Static Pages...");
  await db.insert(banners).values([
    {
      id: "ban_hero_01",
      title: "Pure Comfort, Mindful Care. Period.",
      subtitle: "Made with soft pure cotton topsheet, crafted without chlorine bleach or synthetic perfumes.",
      link: "/shop",
      imageUrl: "/banners/hero-banner.svg",
      badge: "Gentle Care",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "ban_promo_02",
      title: "Thoughtful Care in Plain, Unmarked Packaging",
      subtitle: "Complete confidentiality from our dispatch center directly to your doorstep.",
      link: "/offers",
      imageUrl: "/banners/promo-banner.svg",
      badge: "Discreet Delivery",
      isActive: true,
      sortOrder: 2,
    },
  ]).onConflictDoNothing();

  await db.insert(posts).values([
    {
      id: "post_01",
      title: "How to Choose the Right Sanitary Pad for Your Flow",
      slug: "choose-right-sanitary-pad-flow",
      excerpt: "Navigating pad lengths, absorbency ratings, and cotton vs synthetic fabrics.",
      content: "Understanding your flow and selecting the right length and absorbency is key to lasting comfort. Samaura pure cotton pads are designed with breathable backing and zero artificial fragrances to help you stay fresh and comfortable throughout your day.",
      coverImage: "/banners/hero-banner.svg",
      category: "Period Health",
      readTime: "4 min read",
      author: "Samaura Health Desk",
      isPublished: false, // Seeded articles are draft by default
    },
    {
      id: "post_02",
      title: "Menstrual Cup Beginner Guide: 5 Steps to Confident Comfort",
      slug: "menstrual-cup-guide-beginners",
      excerpt: "Everything you need to know about folding, insertion, and seal verification.",
      content: "Transitioning to a menstrual cup is a thoughtful, cost-effective choice. Made from soft flexible silicone, Samaura menstrual cups provide dependable day and night comfort. Clean thoroughly before first use by boiling in clean water for 5 to 7 minutes.",
      coverImage: "/banners/promo-banner.svg",
      category: "Mindful Periods",
      readTime: "5 min read",
      author: "Samaura Health Desk",
      isPublished: false, // Seeded articles are draft by default
    },
  ]).onConflictDoNothing();

  await db.insert(pages).values([
    {
      id: "page_about",
      slug: "about",
      title: "About Samaura Healthcare",
      content: "# About Samaura Healthcare\n\n*[Replace with client content: Insert brand founding story, leadership team background, and production ethics here]*\n\nSamaura Healthcare was founded to provide women with gentle, skin-first, and thoughtfully crafted feminine hygiene essentials. Our design philosophy centers around high-grade pure cotton topsheets, totally chlorine-free absorbent cores, and compostable plant-based packaging.\n\n### Our Core Values\n- **Skin-First Gentle Materials**: Zero artificial masking perfumes or synthetic dyes.\n- **Discreet Packaging Promise**: Plain, unbranded outer mailers for every customer delivery.\n- **Conscious Formulation**: Responsible material selection that balances performance and skin comfort.",
    },
    {
      id: "page_faq",
      slug: "faq",
      title: "Frequently Asked Questions",
      content: "### Is your packaging completely discreet?\nYes. Every order is packaged in a plain, unmarked brown corrugated box or opaque mailer. The shipping address label includes minimal courier barcodes with no mention of female hygiene, pads, or periods on the exterior.\n\n### What materials are used in Samaura sanitary pads?\n*[Replace with client content: Detailed manufacturing specifications and fiber source information]*\nSamaura sanitary pads use soft pure cotton topsheets, a totally chlorine-free (TCF) cellulose core, and a breathable bottom film designed to facilitate airflow and reduce skin friction.\n\n### How do I select the right menstrual cup size?\n*[Replace with client content: Sizing guide]*\nSize S is recommended for menstruators under 25 or those who have not given birth vaginally. Size M is suitable for flow balance after 25 or post-pregnancy.\n\n### What is your policy on returns and cancellations?\nBecause female hygiene items are intimate health goods, opened packages cannot be returned for hygiene and health reasons. If an item arrives damaged or incorrect, please reach out to customer care within 7 days for a replacement or refund.",
    },
    {
      id: "page_privacy",
      slug: "privacy",
      title: "Privacy Policy",
      content: "# Privacy Policy\n\n### 1. Overview\nThis draft privacy policy outlines how Samaura Healthcare collects, uses, and safeguards personal information when you use our website or purchase our products.\n\n### 2. Information Collected\nWe collect personal information necessary to fulfill your orders and provide customer support:\n- Contact details: Full name, delivery address, phone number, and email address.\n- Transaction details: Order history, items ordered, and payment status. Sensitive payment card numbers and UPI MPINs are handled directly by authorized payment processors and are never stored on our servers.\n\n### 3. Use of Information\nYour information is used solely to:\n- Process and deliver your purchases in discreet packaging.\n- Send order confirmations, tracking numbers, and account updates.\n- Respond to your inquiries submitted via our contact forms.\n\n### 4. Data Sharing & Third Parties\nWe do not sell, rent, or trade your personal information. Relevant data is shared strictly with delivery logistics providers to transport your order and transactional email services to transmit receipts.\n\n### 5. Contact\nFor privacy questions or data access requests, please reach us at care@samaura.com.",
    },
    {
      id: "page_shipping",
      slug: "shipping-returns",
      title: "Shipping & Return Policy",
      content: "# Shipping & Returns Policy\n\n### 1. Discreet Packaging Guarantee\nWe understand that menstrual hygiene is deeply personal. Every package is shipped in a neutral, unmarked outer carton with no logos or descriptions of package contents on the external shipping label.\n\n### 2. Shipping Rates & Delivery Timelines\n- Standard shipping takes between 2 to 6 business days depending on delivery location.\n- Free standard shipping applies to prepaid and eligible orders meeting the minimum order threshold shown at checkout.\n\n### 3. Returns & Replacements\n- In compliance with health, safety, and sanitary guidelines, intimate hygiene items (pads, liners, cups, washes) are non-returnable once opened.\n- If your shipment arrives damaged, defective, or incorrect, please take a photograph and contact our customer care desk within 7 days of delivery for a complimentary replacement or refund.\n\n### 4. Cancellations\nOrders may be cancelled prior to dispatch. If a paid order is cancelled before fulfillment, a full refund will be processed to the original payment method.",
    },
    {
      id: "page_terms",
      slug: "terms",
      title: "Terms & Conditions",
      content: "# Terms and Conditions\n\n### 1. Introduction\nWelcome to Samaura Healthcare. By accessing our website, browsing our product catalog, or placing an order, you agree to these Terms and Conditions.\n\n### 2. Products & Intimate Hygiene Standards\nSamaura Healthcare provides female personal hygiene essentials. All product descriptions are provided in good faith. Due to intimate hygiene considerations, opened or tampered personal hygiene products cannot be returned.\n\n### 3. Orders & Payment\n- Orders placed online are confirmed upon receipt of valid payment authorization or COD verification.\n- In the event of pricing errors or inventory unavailability, Samaura reserves the right to cancel the order and provide a full refund.\n\n### 4. Shipping & Delivery\nWe deliver to serviceable PIN codes across India using third-party courier partners in plain, discreet packaging. Delivery timelines are estimates and subject to regional courier operations.\n\n### 5. Limitation of Liability\nThe products and content on this site are for personal hygiene and educational use only. Samaura Healthcare shall not be liable for indirect or consequential damages arising from site use.",
    },
    {
      id: "page_why_samaura",
      slug: "why-samaura",
      title: "Why Samaura?",
      content: "### Pure Cotton Comfort\nSoft breathable pure cotton topsheets designed for velvety comfort and reduced skin friction.\n\n### Chlorine-Free Formulation\nTotally chlorine-free absorbent core with plant-derived components.\n\n### Without Artificial Fragrances\nZero artificial perfumes or synthetic masking dyes; respects the natural intimate balance.\n\n### Strictly Discreet Delivery\nDelivered across India in unmarked, plain outer mailers with complete privacy.",
    },
  ]).onConflictDoNothing();

  console.log("✅ Seed completed successfully! (4 categories, 8 products, 2 coupons, 1 admin)");
}

// Execute if run directly
if (require.main === module || process.argv[1]?.includes("seed")) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed error:", err);
      process.exit(1);
    });
}
