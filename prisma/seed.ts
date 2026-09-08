import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const cafeLocation = await db.location.upsert({
    where: { id: "sultan-plantation-cafe" },
    update: {},
    create: {
      id: "sultan-plantation-cafe",
      name: "Sultan Nut House — Plantation",
      type: "CAFE",
      addressLine1: "1836 N University Dr",
      city: "Plantation",
      state: "FL",
      postalCode: "33322",
      country: "US",
      isActive: true,
    },
  });

  const warehouse = await db.location.upsert({
    where: { id: "sultan-warehouse" },
    update: {},
    create: {
      id: "sultan-warehouse",
      name: "Sultan Nut House — Fulfillment",
      type: "WAREHOUSE",
      city: "Plantation",
      state: "FL",
      country: "US",
      isActive: true,
    },
  });

  await db.shippingMethod.upsert({
    where: { code: "standard-us" },
    update: {},
    create: {
      code: "standard-us",
      name: "Standard Shipping",
      carrier: "USPS",
      estimatedDaysMin: 3,
      estimatedDaysMax: 6,
      flatRateCents: 795,
      isActive: true,
      position: 0,
    },
  });

  // --- Categories -----------------------------------------------------
  const menuDrinks = await db.category.upsert({
    where: { slug: "menu-drinks" },
    update: {},
    create: { slug: "menu-drinks", kind: "MENU", name: "Drinks", position: 0 },
  });

  const menuDesserts = await db.category.upsert({
    where: { slug: "menu-desserts" },
    update: {},
    create: { slug: "menu-desserts", kind: "MENU", name: "Desserts", position: 1 },
  });

  const shopNuts = await db.category.upsert({
    where: { slug: "nuts" },
    update: {},
    create: { slug: "nuts", kind: "SHOP", name: "Nuts", position: 0 },
  });

  const shopTurkishDelights = await db.category.upsert({
    where: { slug: "turkish-delights" },
    update: {},
    create: { slug: "turkish-delights", kind: "SHOP", name: "Turkish Delights", position: 1 },
  });

  // --- Modifier groups (reusable across products) ----------------------
  const sizeGroup = await db.modifierGroup.create({
    data: {
      name: "Size",
      selectionType: "SINGLE",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      position: 0,
      options: {
        create: [
          { name: "Small", priceDeltaCents: 0, isDefault: true, position: 0 },
          { name: "Medium", priceDeltaCents: 75, position: 1 },
          { name: "Large", priceDeltaCents: 150, position: 2 },
        ],
      },
    },
  });

  const milkGroup = await db.modifierGroup.create({
    data: {
      name: "Milk",
      selectionType: "SINGLE",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      position: 1,
      options: {
        create: [
          { name: "Whole Milk", priceDeltaCents: 0, isDefault: true, position: 0 },
          { name: "Oat Milk", priceDeltaCents: 75, position: 1 },
          { name: "Almond Milk", priceDeltaCents: 75, position: 2 },
        ],
      },
    },
  });

  const sweetnessGroup = await db.modifierGroup.create({
    data: {
      name: "Sweetness",
      selectionType: "SINGLE",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      position: 2,
      options: {
        create: [
          { name: "0%", priceDeltaCents: 0, position: 0 },
          { name: "25%", priceDeltaCents: 0, position: 1 },
          { name: "50%", priceDeltaCents: 0, isDefault: true, position: 2 },
          { name: "75%", priceDeltaCents: 0, position: 3 },
          { name: "100%", priceDeltaCents: 0, position: 4 },
        ],
      },
    },
  });

  const extrasGroup = await db.modifierGroup.create({
    data: {
      name: "Extras",
      selectionType: "MULTI",
      minSelect: 0,
      maxSelect: 4,
      required: false,
      position: 3,
      options: {
        create: [
          { name: "Extra Matcha", priceDeltaCents: 100, position: 0 },
          { name: "Cold Foam", priceDeltaCents: 75, position: 1 },
          { name: "Additional Shot", priceDeltaCents: 100, position: 2 },
        ],
      },
    },
  });

  // --- Cafe products (PICKUP_ONLY) --------------------------------------
  const matcha = await db.product.upsert({
    where: { slug: "iced-matcha-latte" },
    update: {},
    create: {
      slug: "iced-matcha-latte",
      name: "Iced Matcha Latte",
      description: "Stone-ground ceremonial matcha, shaken over ice.",
      fulfillmentType: "PICKUP_ONLY",
      status: "ACTIVE",
      categoryId: menuDrinks.id,
      position: 0,
      variants: {
        create: [
          {
            sku: "MATCHA-ICED",
            name: "Iced Matcha Latte",
            priceCents: 595,
            isDefault: true,
          },
        ],
      },
      modifierGroups: {
        create: [
          { modifierGroupId: sizeGroup.id, position: 0 },
          { modifierGroupId: milkGroup.id, position: 1 },
          { modifierGroupId: sweetnessGroup.id, position: 2 },
          { modifierGroupId: extrasGroup.id, position: 3 },
        ],
      },
    },
  });

  await db.product.upsert({
    where: { slug: "turkish-coffee" },
    update: {},
    create: {
      slug: "turkish-coffee",
      name: "Turkish Coffee",
      description: "Slow-brewed over sand, served with Turkish delight.",
      fulfillmentType: "PICKUP_ONLY",
      status: "ACTIVE",
      categoryId: menuDrinks.id,
      position: 1,
      variants: {
        create: [{ sku: "TURK-COFFEE", name: "Turkish Coffee", priceCents: 450, isDefault: true }],
      },
      modifierGroups: {
        create: [{ modifierGroupId: sweetnessGroup.id, position: 0 }],
      },
    },
  });

  await db.product.upsert({
    where: { slug: "fresh-kunafa" },
    update: {},
    create: {
      slug: "fresh-kunafa",
      name: "Fresh Kunafa",
      description: "Baked to order — crisp semolina pastry, sweet cheese, pistachio.",
      fulfillmentType: "PICKUP_ONLY",
      status: "ACTIVE",
      categoryId: menuDesserts.id,
      position: 0,
      variants: {
        create: [{ sku: "KUNAFA-SLICE", name: "Slice", priceCents: 750, isDefault: true }],
      },
    },
  });

  // --- Shippable products (SHIPPING_ONLY / BOTH) ------------------------
  const pistachios = await db.product.upsert({
    where: { slug: "roasted-pistachios" },
    update: {},
    create: {
      slug: "roasted-pistachios",
      name: "Roasted Pistachios",
      description: "Slow-roasted and lightly salted, sourced and roasted in small batches.",
      fulfillmentType: "SHIPPING_ONLY",
      status: "ACTIVE",
      categoryId: shopNuts.id,
      allergenInfo: "Contains tree nuts. Processed in a facility that also handles peanuts.",
      ingredients: "Pistachios, sea salt.",
      storageInstructions: "Store in a cool, dry place. Refrigerate after opening for extended freshness.",
      position: 0,
      variants: {
        create: [
          { sku: "PISTACHIO-8OZ", name: "8 oz Bag", priceCents: 1299, weightGrams: 227, isDefault: true, position: 0 },
          { sku: "PISTACHIO-16OZ", name: "16 oz Bag", priceCents: 2199, weightGrams: 454, position: 1 },
        ],
      },
    },
  });

  await db.product.upsert({
    where: { slug: "assorted-turkish-delight" },
    update: {},
    create: {
      slug: "assorted-turkish-delight",
      name: "Assorted Turkish Delight",
      description: "Rosewater, pistachio, and pomegranate — a classic gift box assortment.",
      fulfillmentType: "SHIPPING_ONLY",
      status: "ACTIVE",
      categoryId: shopTurkishDelights.id,
      ingredients: "Sugar, cornstarch, rosewater, pistachios, pomegranate.",
      allergenInfo: "Contains tree nuts.",
      position: 0,
      variants: {
        create: [{ sku: "DELIGHT-BOX-16", name: "16-Piece Box", priceCents: 1899, weightGrams: 400, isDefault: true }],
      },
    },
  });

  // --- Inventory for shippable variants ---------------------------------
  const pistachioVariants = await db.productVariant.findMany({ where: { productId: pistachios.id } });
  for (const variant of pistachioVariants) {
    await db.inventory.upsert({
      where: { productVariantId_locationId: { productVariantId: variant.id, locationId: warehouse.id } },
      update: {},
      create: { productVariantId: variant.id, locationId: warehouse.id, quantityOnHand: 100, lowStockThreshold: 10 },
    });
  }

  console.log("Seed complete:", {
    cafeLocation: cafeLocation.name,
    warehouse: warehouse.name,
    sampleCafeProduct: matcha.name,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
