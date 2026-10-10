import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { products, productVariants, productImages, categories, testimonials } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Utility script to clean up sample/testing products and testimonials before client handover.
 * Removes all products and testimonials flagged with isSample = true, their variants, and images.
 * Also removes empty categories created exclusively for sample testing (e.g., Books & Learning).
 *
 * Usage:
 *   Dry-run (default): npm run db:remove-samples
 *   Execute deletion:  npm run db:remove-samples -- --confirm
 */
export async function removeSampleProducts(isConfirmedOverride?: boolean) {
  const isConfirmed = isConfirmedOverride ?? process.argv.includes("--confirm");

  // Determine database host cleanly without exposing credentials or tokens
  const rawUrl = process.env.DATABASE_URL || "file:data/samaura.db";
  let dbHost = "";
  if (rawUrl.startsWith("file:")) {
    dbHost = rawUrl;
  } else {
    try {
      const parsed = new URL(rawUrl.replace(/^libsql:\/\//, "https://"));
      dbHost = parsed.host;
    } catch {
      dbHost = rawUrl.split("@").pop()?.split("/")[0] || "remote-host";
    }
  }

  console.log("=================================================");
  console.log("SAMAURA HEALTHCARE — SAMPLE DATA CLEANUP UTILITY");
  console.log(`Database Target: ${dbHost}`);
  console.log(`Execution Mode:  ${isConfirmed ? "EXECUTE (--confirm)" : "DRY RUN (safe simulation)"}`);
  console.log("=================================================\n");

  // 1. Query all sample products
  const sampleProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(eq(products.isSample, true));

  // 2. Query all sample testimonials
  const sampleTestimonials = await db
    .select({
      id: testimonials.id,
      name: testimonials.name,
      city: testimonials.city,
      rating: testimonials.rating,
    })
    .from(testimonials)
    .where(eq(testimonials.isSample, true));

  if (sampleProducts.length === 0 && sampleTestimonials.length === 0) {
    console.log("✅ No sample products or testimonials found in database (isSample = true). Database is already clean.\n");
    return {
      deletedCount: 0,
      deletedProductsCount: 0,
      deletedTestimonialsCount: 0,
      totalDeletedCount: 0,
      sampleProducts: [],
      sampleTestimonials: [],
    };
  }

  if (sampleProducts.length > 0) {
    console.log(`Found ${sampleProducts.length} sample product(s):`);
    for (const sp of sampleProducts) {
      console.log(` - [${sp.id}] ${sp.name} (/${sp.slug})`);
    }
    console.log("");
  }

  if (sampleTestimonials.length > 0) {
    console.log(`Found ${sampleTestimonials.length} sample testimonial(s):`);
    for (const st of sampleTestimonials) {
      console.log(` - [${st.id}] ${st.name} (${st.city || "No city"}, ${st.rating}★)`);
    }
    console.log("");
  }

  // 3. Dry run exit
  if (!isConfirmed) {
    console.log("-------------------------------------------------");
    console.log(`[DRY RUN COMPLETE] ${sampleProducts.length} sample product(s) and ${sampleTestimonials.length} sample testimonial(s) identified.`);
    console.log("Zero records were modified or deleted.");
    console.log("To permanently delete these sample records, rerun with: npm run db:remove-samples -- --confirm");
    console.log("-------------------------------------------------\n");
    return {
      deletedCount: 0,
      deletedProductsCount: 0,
      deletedTestimonialsCount: 0,
      totalDeletedCount: 0,
      sampleProducts,
      sampleTestimonials,
    };
  }

  // 4. Confirm deletion execution
  if (sampleProducts.length > 0) {
    const sampleIds = sampleProducts.map((p) => p.id);

    console.log("Deleting associated product images...");
    await db.delete(productImages).where(inArray(productImages.productId, sampleIds));

    console.log("Deleting associated product variants...");
    await db.delete(productVariants).where(inArray(productVariants.productId, sampleIds));

    console.log("Deleting sample products...");
    await db.delete(products).where(inArray(products.id, sampleIds));
  }

  if (sampleTestimonials.length > 0) {
    console.log("Deleting sample testimonials...");
    await db.delete(testimonials).where(eq(testimonials.isSample, true));
  }

  // 5. Check for categories left empty that were created for samples (e.g. books-learning)
  const remainingProds = await db.select({ categoryId: products.categoryId }).from(products);
  const activeCategoryIds = new Set(remainingProds.map((p) => p.categoryId));

  const allCategories = await db.select().from(categories);
  const deletedCategories: string[] = [];
  for (const cat of allCategories) {
    if (!activeCategoryIds.has(cat.id) && cat.slug === "books-learning") {
      await db.delete(categories).where(eq(categories.id, cat.id));
      deletedCategories.push(cat.name);
      console.log(`Cleaned up empty sample-only category: ${cat.name} (${cat.slug})`);
    }
  }

  console.log("\n=================================================");
  console.log(`✅ Deletion Complete: Removed ${sampleProducts.length} sample product(s) and ${sampleTestimonials.length} sample testimonial(s).`);
  if (deletedCategories.length > 0) {
    console.log(`✅ Removed empty sample category: ${deletedCategories.join(", ")}`);
  }
  console.log("Database is now ready for production client catalog insertion.");
  console.log("=================================================\n");

  return {
    deletedCount: sampleProducts.length,
    deletedProductsCount: sampleProducts.length,
    deletedTestimonialsCount: sampleTestimonials.length,
    totalDeletedCount: sampleProducts.length + sampleTestimonials.length,
    sampleProducts,
    sampleTestimonials,
  };
}

// Execute if run directly from CLI
if (require.main === module || process.argv[1]?.includes("db-remove-samples")) {
  if (process.env.CHECK_RUNNING === "1") {
    console.log("[Re-entry Guard] CHECK_RUNNING=1 is already set; exiting db-remove-samples immediately.");
    process.exit(0);
  }
  removeSampleProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error executing db:remove-samples:", err);
      process.exit(1);
    });
}
