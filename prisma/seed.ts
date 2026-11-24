import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, SEED_WEBCAMS } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  for (const cat of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    });
  }

  for (const cam of SEED_WEBCAMS) {
    const country = await prisma.country.upsert({
      where: { slug: cam.country.slug },
      update: { name: cam.country.name, flag: cam.country.flag },
      create: {
        isoCode: cam.country.isoCode,
        name: cam.country.name,
        slug: cam.country.slug,
        flag: cam.country.flag,
      },
    });

    const city = await prisma.city.upsert({
      where: { countryId_slug: { countryId: country.id, slug: cam.city.slug } },
      update: { name: cam.city.name, lat: cam.city.lat, lng: cam.city.lng, timezone: cam.city.timezone },
      create: {
        countryId: country.id,
        name: cam.city.name,
        slug: cam.city.slug,
        lat: cam.city.lat,
        lng: cam.city.lng,
        timezone: cam.city.timezone,
      },
    });

    const webcam = await prisma.webcam.upsert({
      where: { slug: cam.slug },
      update: { title: cam.title, description: cam.description, bestTime: cam.bestTime, reviewStatus: "APPROVED" },
      create: {
        cityId: city.id,
        slug: cam.slug,
        title: cam.title,
        description: cam.description,
        bestTime: cam.bestTime,
        lat: cam.city.lat,
        lng: cam.city.lng,
        reviewStatus: "APPROVED",
      },
    });

    if (cam.stream) {
      await prisma.stream.upsert({
        where: { sourceType_externalId: { sourceType: cam.stream.sourceType, externalId: cam.stream.externalId } },
        update: { embedUrl: cam.stream.embedUrl, status: "LIVE", lastCheckedAt: new Date() },
        create: {
          webcamId: webcam.id,
          sourceType: cam.stream.sourceType,
          externalId: cam.stream.externalId,
          embedUrl: cam.stream.embedUrl,
          sourceUrl: cam.stream.sourceUrl,
          status: "LIVE",
          lastCheckedAt: new Date(),
        },
      });
    }

    for (const c of cam.categories) {
      const cat = await prisma.category.findUnique({ where: { slug: c.slug } });
      if (cat) {
        await prisma.webcamCategory.upsert({
          where: { webcamId_categoryId: { webcamId: webcam.id, categoryId: cat.id } },
          update: {},
          create: { webcamId: webcam.id, categoryId: cat.id },
        });
      }
    }
  }

  console.log("Seeded categories, countries, cities, and webcams.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
