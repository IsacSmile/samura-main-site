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
import { notInArray } from "drizzle-orm";

export async function runSeed() {
  console.log("🌱 Seeding Samaura Healthcare database (Phase 10 - Client Content)...");

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
      phone: "6282132510",
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

  // 2. Clear sample products & variants (Phase 10: remove pads, liners, wash, roll-on)
  console.log("2. Removing sample products per Phase 10 requirements...");
  await db.delete(productImages);
  await db.delete(productVariants);
  await db.delete(products);

  // 3. Seed ONLY 2 Categories: Menstrual Cups and Gift Collections
  console.log("3. Seeding Categories (Menstrual Cups & Gift Collections only)...");
  const categoryData = [
    {
      id: "cat_menstrual_cups",
      name: "Menstrual Cups",
      slug: "menstrual-cups",
      description: "Learn about the product, its features, usage, care, and how to get started with reusable menstrual hygiene.",
      image: "/products/menstrual-cup.svg",
      sortOrder: 1,
    },
    {
      id: "cat_gift_collections",
      name: "Gift Collections",
      slug: "gift-collections",
      description: "Thoughtfully curated gift packs for girls approaching menarche and for girls and women on special occasions.",
      image: "/products/gift-pack.svg",
      sortOrder: 2,
    },
  ];

  if (process.env.NODE_ENV !== "production") {
    // Delete legacy categories no longer in catalogue
    await db.delete(categories).where(notInArray(categories.id, ["cat_menstrual_cups", "cat_gift_collections"]));
  }

  for (const cat of categoryData) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          sortOrder: cat.sortOrder,
        },
      });
  }

  // 4. Seed Coupons (Non-production only)
  if (process.env.NODE_ENV !== "production") {
    console.log("4. Seeding Demo Coupons (WELCOME15, SAMAURA10)...");
    await db.insert(coupons).values([
      {
        id: "cpn_welcome15",
        code: "WELCOME15",
        discountType: "percentage",
        discountValue: 15, // 15%
        minOrderPaise: 49900,
        maxDiscountPaise: 15000,
        usageLimit: 1000,
        timesUsed: 0,
        isActive: true,
      },
      {
        id: "cpn_samaura10",
        code: "SAMAURA10",
        discountType: "percentage",
        discountValue: 10,
        minOrderPaise: 29900,
        maxDiscountPaise: 10000,
        usageLimit: 500,
        timesUsed: 0,
        isActive: true,
      },
    ]).onConflictDoNothing();
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

  if (process.env.NODE_ENV !== "production") {
    await db.delete(settings);
  }

  const initialSettings = [
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
      key: "contact_phone",
      value: "+91 6282132510",
      description: "Store contact phone",
    },
    {
      key: "contact_email",
      value: "samaurahealthcare@gmail.com",
      description: "Store contact email",
    },
    {
      key: "site_url",
      value: "https://www.samaurahealthcare.com",
      description: "Website base URL",
    },
    {
      key: "whatsapp_number",
      value: "",
      description: "Customer support WhatsApp hotline (empty until confirmed)",
    },
    {
      key: "social_instagram",
      value: "",
      description: "Instagram URL (empty to hide)",
    },
    {
      key: "social_facebook",
      value: "",
      description: "Facebook URL (empty to hide)",
    },
    {
      key: "social_linkedin",
      value: "",
      description: "LinkedIn URL (empty to hide)",
    },
    {
      key: "store_address",
      value: "",
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
      key: "announcement_text",
      value: "✨ Menstrual Health Education, Awareness & Sustainable Menstrual Cups",
      description: "Announcement bar text",
    },
  ];

  for (const s of initialSettings) {
    await db
      .insert(settings)
      .values(s)
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: s.value, description: s.description },
      });
  }

  // 6. Seed Banners, Static Pages & Blog Drafts
  console.log("6. Seeding Banners & Static CMS Pages...");
  if (process.env.NODE_ENV !== "production") {
    await db.delete(banners);
    await db.delete(posts);
    await db.delete(pages);
  }

  await db.insert(banners).values([
    {
      id: "ban_hero_01",
      title: "Menstrual Health Education & Hygiene Solutions",
      subtitle: "Empowering women, girls, and young people through accessible education and practical menstrual hygiene solutions.",
      link: "/shop",
      imageUrl: "/banners/hero-banner.svg",
      badge: "Samaura Healthcare",
      isActive: true,
      sortOrder: 1,
    },
  ]).onConflictDoNothing();

  const cmsPagesData = [
    {
      id: "page_about",
      slug: "about",
      title: "About Us",
      content: `# About Us

We are a purpose-driven startup committed to making menstrual health education accessible, inclusive, and empowering for women and young people across all sections of society.

Our work focuses on educating young girls and children approaching menstrual age, breaking the stigma surrounding menstruation, and helping individuals understand menstrual hygiene, manage challenges, and make informed choices about their menstrual health.

Through educational publications, awareness programmes, community outreach, and menstrual hygiene initiatives, we aim to create a society where menstruation is understood, discussed openly, and managed with confidence and dignity.

As the brand owners of Samaura Menstrual Cups, we also promote awareness and informed adoption of menstrual cups as a reusable alternative to disposable sanitary pads, supporting individuals who wish to transition towards more sustainable menstrual hygiene practices.

Our mission is to combine education, awareness, and accessible menstrual hygiene solutions to make a meaningful difference in the lives of women and girls.

### Mission
To empower women, girls, and young people through accessible menstrual health education, community awareness, and practical menstrual hygiene solutions, ensuring that no one is left uninformed or unsupported during menstruation.

### Vision
A society where menstruation is free from stigma, every young person has access to age-appropriate menstrual education, and every individual can make informed choices about menstrual hygiene with confidence, dignity, and access to appropriate products.`,
    },
    {
      id: "page_learn",
      slug: "learn",
      title: "Learn Before You Transition",
      content: `# Learn Before You Transition

Access educational resources, FAQs, and guidance to help you make an informed decision about menstrual cups.

Transitioning to reusable menstrual care is an empowering journey. Take your time to understand cup folds, proper hygiene, and how to comfortably adapt to reusable menstrual cups.`,
    },
    {
      id: "page_awareness",
      slug: "awareness",
      title: "Awareness & Support",
      content: `# Awareness & Support

Participate in menstrual cup awareness sessions and educational programmes to learn more about reusable menstrual products.

We partner with educational institutions, community groups, NGOs, and workplace wellness teams to organize engaging, stigma-free workshops that promote menstrual dignity, anatomical clarity, and practical hygiene awareness.`,
    },
    {
      id: "page_gifts",
      slug: "gifts",
      title: "Gift Collections",
      content: `# Gift Collections

Thoughtfully curated gift packs for girls approaching menarche and for girls and women on special occasions.

Through educational gifts and collaborations with schools, NGOs, communities, and CSR partners, we aim to make menstrual health education, awareness, and practical hygiene solutions more accessible.`,
    },
    {
      id: "page_home_initiatives",
      slug: "home-initiatives",
      title: "Our Key Initiatives",
      content: `### Menstrual Health Education & Publications
Providing age-appropriate menstrual health education to children and young people through educational programmes, books, and learning materials that promote understanding of menstruation, puberty, personal hygiene, and first-period preparedness.

### Menstrual Awareness & Community Empowerment
Organising awareness sessions, workshops, and community outreach programmes to break menstrual stigma, address misconceptions, and empower women and girls across all sections of society to manage menstrual health with confidence and dignity.

### Sustainable Menstrual Hygiene, Thoughtful Gifting & Partnerships
Promoting informed adoption of reusable menstrual products through Samaura Menstrual Cups, while developing thoughtfully curated gift packs for girls approaching menarche and for girls and women on special occasions. Through educational gifts and collaborations with schools, NGOs, communities, and CSR partners, we aim to make menstrual health education, awareness, and practical hygiene solutions more accessible.`,
    },
    {
      id: "page_home_explore",
      slug: "home-explore",
      title: "Explore Samaura",
      content: `### Samaura Menstrual Cup
Learn about the product, its features, usage, care, and how to get started with reusable menstrual hygiene.

### Learn Before You Transition
Access educational resources, FAQs, and guidance to help you make an informed decision about menstrual cups.

### Awareness & Support
Participate in menstrual cup awareness sessions and educational programmes to learn more about reusable menstrual products.`,
    },
    {
      id: "page_home_gifts",
      slug: "home-gifts",
      title: "Gift Collections",
      content: `### My First Period Gift Box
An age-appropriate gift pack for girls approaching menarche, combining educational publications, personal-care essentials, and thoughtful keepsakes to help them feel informed and supported.

### Self-Care & Celebration Hampers
Customisable gift packs for birthdays, special occasions, and celebrations, designed for girls and women with personal-care products, accessories, and meaningful additions.

### Custom & Institutional Gift Packs
Personalised gift kits for schools, NGOs, CSR initiatives, and organisations, tailored to age groups, budgets, and programme objectives.`,
    },
    {
      id: "page_faq",
      slug: "faq",
      title: "Frequently Asked Questions",
      content: "", // Empty: hidden until client adds content
    },
    {
      id: "page_privacy",
      slug: "privacy",
      title: "Privacy Policy",
      content: `# Privacy Policy

### 1. Overview
This privacy policy outlines how Samaura Healthcare collects, uses, and safeguards personal information when you use our website or submit an enquiry.

### 2. Information Collected
We collect personal information necessary to answer inquiries, coordinate educational sessions, or deliver orders:
- Contact details: Full name, address, phone number, and email address.
- Inquiries & topics: Session requests, institutional gifting details, and customer support questions.

### 3. Use of Information
Your information is used solely to:
- Respond to inquiries and schedule awareness sessions.
- Process and deliver purchases or gift collection orders.
- Provide order updates and essential service communications.

### 4. Data Sharing & Third Parties
We do not sell, rent, or trade your personal information. Relevant data is shared strictly with authorized logistics partners and essential communication services.

### 5. Contact
For privacy questions or data access requests, please reach us at samaurahealthcare@gmail.com.`,
    },
    {
      id: "page_shipping",
      slug: "shipping-returns",
      title: "Shipping & Return Policy",
      content: `# Shipping & Returns Policy

### 1. Delivery Timelines
- Standard shipping takes between 2 to 6 business days depending on location across India.
- Free standard shipping applies to orders meeting the threshold shown at checkout.

### 2. Returns & Replacements
- In compliance with health, safety, and sanitary standards, personal hygiene goods cannot be returned once opened.
- If an item arrives damaged or defective, please contact our support desk at samaurahealthcare@gmail.com within 7 days of delivery with photographic confirmation for a prompt resolution.

### 3. Cancellations
Orders may be cancelled prior to dispatch by reaching out to customer support.`,
    },
    {
      id: "page_terms",
      slug: "terms",
      title: "Terms & Conditions",
      content: `# Terms and Conditions

### 1. Introduction
Welcome to Samaura Healthcare. By accessing our website, browsing our resources, or placing an order, you agree to these Terms and Conditions.

### 2. Products & Educational Services
Samaura Healthcare provides menstrual hygiene products, educational publications, and community awareness programmes. All descriptions and guidance are provided in good faith.

### 3. Limitation of Liability
The content on this website is for educational and hygiene awareness purposes. Samaura Healthcare shall not be liable for indirect or consequential damages arising from site use.`,
    },
  ];

  for (const page of cmsPagesData) {
    await db
      .insert(pages)
      .values(page)
      .onConflictDoUpdate({
        target: pages.slug,
        set: {
          title: page.title,
          content: page.content,
        },
      });
  }

  console.log("✅ Seed completed successfully! (2 categories: Menstrual Cups & Gift Collections, 0 sample products, client content applied)");
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
