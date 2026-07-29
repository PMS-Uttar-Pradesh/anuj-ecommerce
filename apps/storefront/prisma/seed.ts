import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  // 0. Store Settings — singleton row for global configuration
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {}, // never overwrite an admin-configured value on re-seed
    create: {
      id: "default",
      freeDeliveryThreshold: 999,
    },
  });
  console.log("StoreSettings seeded.");

  // 1. Categories
  const categories = [
    { name: "Pens", slug: "pens" },
    { name: "Pencils", slug: "pencils" },
    { name: "Notebooks", slug: "notebooks" },
    { name: "Drawing Books", slug: "drawing-books" },
    { name: "Balloons", slug: "balloons" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Categories seeded.");

  // Get categories for relations
  const dbCategories = await prisma.category.findMany();
  const catMap = dbCategories.reduce((acc, cat) => {
    acc[cat.slug] = cat.id;
    return acc;
  }, {} as Record<string, string>);

  // 2. Products
  const products = [
    // PENS
    {
      name: "Pilot V5 Liquid Ink Rollerball Pen",
      slug: "pilot-v5-rollerball",
      description: "Fine point 0.5mm needle tip for smooth writing.",
      price: 65, mrp: 80, isFeatured: true,
      categoryId: catMap["pens"],
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Blue", stock: 100 },
        { optionName: "Color", optionValue: "Black", stock: 50 },
      ]
    },
    {
      name: "Reynolds Trimax Blue",
      slug: "reynolds-trimax-blue",
      description: "Classic fluid ink pen.",
      price: 45, mrp: 50, isFeatured: false,
      categoryId: catMap["pens"],
      image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Blue", stock: 300 }
      ]
    },
    {
      name: "Parker Vector Standard",
      slug: "parker-vector-standard",
      description: "Elegant professional pen.",
      price: 350, mrp: 400, isFeatured: true,
      categoryId: catMap["pens"],
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Silver", stock: 50 }
      ]
    },
    {
      name: "Muji Gel Pen 0.5",
      slug: "muji-gel-cap-05",
      description: "Minimalist Japanese gel pen.",
      price: 150, mrp: 150, isFeatured: false,
      categoryId: catMap["pens"],
      image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Black", stock: 120 }
      ]
    },

    // PENCILS
    {
      name: "Apsara Platinum Extra Dark",
      slug: "apsara-platinum-pencils",
      description: "Extra dark lead for clear handwriting.",
      price: 45, mrp: 50, isFeatured: true,
      categoryId: catMap["pencils"],
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Type", optionValue: "Pack of 10", stock: 500 }
      ]
    },
    {
      name: "Faber-Castell Grip 2001",
      slug: "faber-castell-grip",
      description: "Ergonomic triangular shape.",
      price: 120, mrp: 150, isFeatured: false,
      categoryId: catMap["pencils"],
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Type", optionValue: "HB", stock: 200 }
      ]
    },
    {
      name: "Staedtler Mars Lumograph",
      slug: "staedtler-mars",
      description: "Premium quality drafting pencil.",
      price: 90, mrp: 110, isFeatured: false,
      categoryId: catMap["pencils"],
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Grade", optionValue: "2B", stock: 40 },
        { optionName: "Grade", optionValue: "4B", stock: 40 }
      ]
    },
    {
      name: "Ticonderoga #2 Yellow Pencils",
      slug: "ticonderoga-no2",
      description: "The world's best pencil.",
      price: 180, mrp: 200, isFeatured: false,
      categoryId: catMap["pencils"],
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Type", optionValue: "Pack of 12", stock: 150 }
      ]
    },

    // NOTEBOOKS
    {
      name: "Classmate Premium Notebook",
      slug: "classmate-premium-notebook",
      description: "Long notebook, 140 pages, single line.",
      price: 65, mrp: 75, isFeatured: true,
      categoryId: catMap["notebooks"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Size", optionValue: "A4", stock: 400 }
      ]
    },
    {
      name: "Moleskine Classic Ruled",
      slug: "moleskine-classic",
      description: "Hard cover, large notebook.",
      price: 1500, mrp: 1800, isFeatured: true,
      categoryId: catMap["notebooks"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Black", stock: 40 }
      ]
    },
    {
      name: "Navneet Youva Spiral",
      slug: "navneet-youva-spiral",
      description: "A4 size spiral bound notebook.",
      price: 120, mrp: 140, isFeatured: false,
      categoryId: catMap["notebooks"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Size", optionValue: "A4", stock: 250 }
      ]
    },
    {
      name: "Paperkraft Signature",
      slug: "paperkraft-signature",
      description: "Premium PU cover notebook.",
      price: 250, mrp: 299, isFeatured: false,
      categoryId: catMap["notebooks"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Brown", stock: 100 }
      ]
    },

    // DRAWING BOOKS
    {
      name: "Classmate Drawing Book",
      slug: "classmate-drawing",
      description: "40 pages, unruled white paper.",
      price: 40, mrp: 50, isFeatured: false,
      categoryId: catMap["drawing-books"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Size", optionValue: "A4", stock: 300 }
      ]
    },
    {
      name: "Brustro Artists Sketchbook",
      slug: "brustro-artists-sketchbook",
      description: "160 GSM premium sketch paper.",
      price: 350, mrp: 400, isFeatured: true,
      categoryId: catMap["drawing-books"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Size", optionValue: "A5", stock: 60 }
      ]
    },
    {
      name: "Camel Cartridge Sketch Book",
      slug: "camel-cartridge",
      description: "Spiral bound, A3 size.",
      price: 180, mrp: 220, isFeatured: false,
      categoryId: catMap["drawing-books"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Size", optionValue: "A3", stock: 120 }
      ]
    },
    {
      name: "Navneet Drawing Book Big",
      slug: "navneet-drawing-big",
      description: "Standard drawing book for schools.",
      price: 60, mrp: 75, isFeatured: false,
      categoryId: catMap["drawing-books"],
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Size", optionValue: "A4", stock: 400 }
      ]
    },

    // BALLOONS
    {
      name: "Premium Metallic Balloons",
      slug: "metallic-balloons-pack",
      description: "Pack of 50 metallic party balloons.",
      price: 150, mrp: 200, isFeatured: true,
      categoryId: catMap["balloons"],
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Gold", stock: 100 },
        { optionName: "Color", optionValue: "Silver", stock: 100 }
      ]
    },
    {
      name: "Pastel Macaron Balloons",
      slug: "pastel-macaron-balloons",
      description: "Pack of 100 soft pastel balloons.",
      price: 250, mrp: 300, isFeatured: false,
      categoryId: catMap["balloons"],
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Assorted", stock: 150 }
      ]
    },
    {
      name: "Happy Birthday Foil Balloon Set",
      slug: "hbd-foil-balloons",
      description: "Complete letter set in gold.",
      price: 350, mrp: 450, isFeatured: true,
      categoryId: catMap["balloons"],
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Color", optionValue: "Gold", stock: 80 }
      ]
    },
    {
      name: "Water Balloons Pack",
      slug: "water-balloons-pack",
      description: "Pack of 200 water balloons with pump.",
      price: 120, mrp: 150, isFeatured: false,
      categoryId: catMap["balloons"],
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop",
      variants: [
        { optionName: "Type", optionValue: "With Pump", stock: 300 }
      ]
    },
  ];

  for (const prod of products) {
    const { image, variants, ...productData } = prod;
    
    const dbProd = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: productData,
      create: productData,
    });

    // Upsert primary image
    await prisma.productImage.upsert({
      where: { id: `img-${dbProd.id}` },
      update: { url: image },
      create: {
        id: `img-${dbProd.id}`,
        productId: dbProd.id,
        url: image,
        alt: prod.name,
        isPrimary: true,
      },
    });

    // Upsert variants
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { id: `var-${dbProd.id}-${v.optionValue.replace(/\s+/g, '-')}` },
        update: v,
        create: {
          id: `var-${dbProd.id}-${v.optionValue.replace(/\s+/g, '-')}`,
          productId: dbProd.id,
          ...v
        }
      });
    }
  }

  console.log("Products, images, and variants seeded.");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
