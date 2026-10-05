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
      phone: "+919876543210",
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
      phone: "+919811223344",
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
      description: "100% certified organic cotton, rash-free, ultra-absorbent pads for daytime and overnight flow.",
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
      description: "100% medical-grade silicone cups offering 12-hour leak-proof, zero-waste period freedom.",
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
      name: "Organic Cotton Ultra-Thin Day Pads",
      slug: "organic-cotton-ultra-thin-day-pads",
      shortDescription: "Ultra-thin, rash-free daytime pads with 100% certified organic cotton topsheet.",
      description:
        "Designed specifically for sensitive skin, Samaura Organic Cotton Day Pads eliminate plastic chafing and chemical irritation. Features a super-absorbent core that locks moisture in seconds, flexible wings that stay in place, and a breathable bottom film that prevents humidity build-up.",
      basePricePaise: 29900, // ₹299.00
      salePricePaise: 24900, // ₹249.00
      isFeatured: true,
      isBestseller: true,
      rating: 4.9,
      reviewCount: 142,
      badge: "Bestseller",
      flowType: "Regular to Moderate Flow",
      ingredients:
        "100% GOTS Certified Organic Cotton (Topsheet), Chlorine-Free Elemental Wood Pulp (Absorbent Core), Super Absorbent Polymer (SAP), Plant-based Bioplastic Backing, Medical-Grade Non-Toxic Adhesive.",
      absorptionGuide:
        "Absorbs up to 80ml. Ideal for regular to moderate daytime menstrual flow. Recommended change every 4–6 hours.",
      usageGuide:
        "1. Peel off the release paper from the back.\n2. Position the pad in the center of your underwear.\n3. Remove wing papers and wrap wings firmly underneath the panty gusset.\n4. Wrap used pad in wrapper and dispose in bin. Never flush.",
      features: JSON.stringify([
        "100% GOTS Certified Organic Cotton Topsheet",
        "Zero Chlorine, Fragrance or Synthetic Dyes",
        "Breathable plant-based backing prevents rashes",
        "Dual-core quick absorption channels",
      ]),
      faq: JSON.stringify([
        {
          q: "How often should I change this pad?",
          a: "Every 4 to 6 hours depending on your flow for optimal hygiene.",
        },
        {
          q: "Are these pads biodegradable?",
          a: "The organic cotton topsheet and plant cellulose core are biodegradable. Outer wrapper is recyclable.",
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
      name: "Overnight Heavy Flow Anion Chip Pads (XXL 320mm)",
      slug: "overnight-heavy-flow-anion-pads-xxl",
      shortDescription: "Extra-long 320mm night pads with wide back flare and antibacterial green anion strip.",
      description:
        "Sleep uninterrupted through your heaviest nights. Samaura Overnight Pads feature a 320mm contoured shape with double-wide posterior wings that prevent back-leaks in all sleeping postures. Embedded tourmaline anion strip neutralizes odor naturally.",
      basePricePaise: 34900,
      salePricePaise: 29900,
      isFeatured: true,
      isBestseller: true,
      rating: 4.95,
      reviewCount: 98,
      badge: "Zero Leaks",
      flowType: "Heavy to Very Heavy Flow",
      ingredients:
        "100% Organic Cotton Topsheet, Tourmaline Anion Strip, Super Absorbent Core with Japanese SAP, Breathable PE Film, Non-Toxic Adhesive.",
      absorptionGuide:
        "Absorbs up to 180ml. Designed for heavy flow, post-delivery, and uninterrupted 8-hour overnight sleep with 320mm wide rear coverage.",
      usageGuide:
        "1. Peel protective back strip.\n2. Align pad with the wider fan shape at the posterior (back) of underwear.\n3. Wrap both sets of wings securely underneath.\n4. Dispose thoughtfully in bin.",
      features: JSON.stringify([
        "320mm Extra-Long Profile with Wide Fan Back",
        "Natural Green Tea & Tourmaline Anion Strip",
        "Locks up to 180ml of fluid without feeling wet",
        "Super-soft cotton wings with secure grip adhesive",
      ]),
      faq: JSON.stringify([
        {
          q: "Will this stay in place while tossing in bed?",
          a: "Yes, our reinforced medical-grade adhesive holds securely across cotton underwear.",
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
      rating: 4.8,
      reviewCount: 0,
      badge: "Daily Fresh",
      flowType: "Light Spotting & Daily Discharge",
      ingredients:
        "100% Organic Cotton Surface, Air-Laid Micro-Porous Absorbent Core, Biodegradable Water-Proof Backsheet.",
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
      name: "Curved Flex Organic Cotton Liners",
      slug: "curved-flex-organic-cotton-liners",
      shortDescription: "Anatomically contoured 180mm cotton liners designed for active lifestyles and yoga.",
      description:
        "Active, flexible, and zero bunching. Specially curved to mirror your body's movements without shifting. Great for workouts, travel, and non-period discharge days.",
      basePricePaise: 22900,
      salePricePaise: 18900,
      isFeatured: false,
      isBestseller: false,
      rating: 4.85,
      reviewCount: 0,
      badge: "Active Fit",
      flowType: "Light Spotting & Daily Discharge",
      ingredients:
        "100% Pure Organic Cotton Topsheet, Plant Cellulose Core, Breathable Back Film.",
      absorptionGuide:
        "Absorbs 25ml. Anatomical curve designed for active days, yoga, gym workouts, and contoured underwear.",
      usageGuide:
        "1. Remove adhesive strip.\n2. Affix along natural contour of sportswear or panties.\n3. Replace after workout or active day.",
      features: JSON.stringify([
        "Anatomically shaped side curvature",
        "Hypoallergenic adhesive that won't twist",
        "Dermatologically tested for zero itching",
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
      name: "Medical-Grade Silicone Menstrual Cup",
      slug: "medical-grade-silicone-menstrual-cup",
      shortDescription: "100% US-FDA approved biocompatible silicone cup with ribbed stem and travel pouch.",
      description:
        "Experience true period liberation with Samaura's bell-shaped menstrual cup. Made from biocompatible, velvety medical silicone that folds easily and pops open gently. Offers up to 12 consecutive hours of leak-proof protection.",
      basePricePaise: 49900,
      salePricePaise: 39900,
      isFeatured: true,
      isBestseller: true,
      rating: 4.85,
      reviewCount: 110,
      badge: "Save 20%",
      flowType: "All Flows (12hr Protection)",
      ingredients:
        "100% US-FDA Approved Medical-Grade Liquid Silicone. Zero BPA, latex, phthalates, dioxins, or toxins.",
      absorptionGuide:
        "Holds up to 25ml (Size Small) / 30ml (Size Medium) / 35ml (Size Large). Up to 12 hours continuous protection without changing.",
      usageGuide:
        "1. Sterilize in boiling water for 3–5 minutes before first use.\n2. Wash hands thoroughly and fold cup (C-Fold or Punch-Down Fold).\n3. Relax pelvic muscles and insert angled toward tailbone.\n4. Rotate gently to ensure full seal.\n5. Pinch base to release vacuum seal before removing.",
      features: JSON.stringify([
        "100% US-FDA Approved Medical Grade Silicone",
        "Velvety matte finish with easy-grip ribbed base",
        "Includes breathable organic cotton storage pouch",
        "Reusable up to 10 years",
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
      rating: 4.9,
      reviewCount: 0,
      badge: "99.9% Sterile",
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
      rating: 4.9,
      reviewCount: 76,
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
        "Free from parabens, SLS, or synthetic perfume",
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
      rating: 4.75,
      reviewCount: 0,
      badge: "100% Herbal",
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



  // 4. Seed 2 Coupons
  console.log("4. Seeding 2 Coupons...");
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
      title: "Pure Comfort, Zero Rash. Period.",
      subtitle: "Made with 100% certified organic cotton topsheet. No chlorine, perfumes, or synthetic plastics.",
      link: "/shop",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
      badge: "Dermatologist Approved",
      isActive: true,
      sortOrder: 1,
    },
  ]).onConflictDoNothing();

  await db.insert(posts).values([
    {
      id: "post_01",
      title: "How to Choose the Right Sanitary Pad for Your Flow",
      slug: "choose-right-sanitary-pad-flow",
      excerpt: "Navigating pad lengths, absorbency ratings, and cotton vs synthetic fabrics.",
      content: "Full guide on choosing the best organic pad for daytime and nighttime flow.",
      coverImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800",
      category: "Period Health",
      readTime: "4 min read",
      author: "Dr. Ananya Nair",
      isPublished: true,
    },
    {
      id: "post_02",
      title: "Menstrual Cup Beginner Guide: 5 Steps to Zero Leaks",
      slug: "menstrual-cup-guide-beginners",
      excerpt: "Everything you need to know about folding, insertion, and seal verification.",
      content: "Complete guide on transitioning to silicone cups.",
      coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
      category: "Sustainable Periods",
      readTime: "5 min read",
      author: "Samaura Health Desk",
      isPublished: true,
    },
  ]).onConflictDoNothing();

  await db.insert(pages).values([
    {
      id: "page_about",
      slug: "about",
      title: "About Samaura Healthcare",
      content: "Samaura Healthcare is dedicated to providing Indian women with gentle, organic, toxin-free female hygiene products.",
    },
    {
      id: "page_faq",
      slug: "faq",
      title: "Frequently Asked Questions",
      content: "Answers about discreet shipping, organic certification, and product care.",
    },
    {
      id: "page_privacy",
      slug: "privacy",
      title: "Privacy Policy",
      content: "We protect your confidentiality and never share your order details.",
    },
    {
      id: "page_shipping",
      slug: "shipping-returns",
      title: "Shipping & Return Policy",
      content: "Discreet packaging guarantee and 7-day hassle-free return policy for damaged items.",
    },
    {
      id: "page_terms",
      slug: "terms",
      title: "Terms & Conditions",
      content: "Terms of service and customer care policies.",
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
