import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { config } from "../config";

async function main() {
  console.log("Seeding database...");

  // Roles
  const roleNames = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "MENU_MANAGER"];
  const roles: Record<string, { id: string }> = {};
  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name.replace("_", " ")} role` },
    });
  }

  // Default admin user
  const hashedPassword = await bcrypt.hash(config.admin.defaultPassword, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: config.admin.defaultEmail },
    update: {},
    create: {
      email: config.admin.defaultEmail,
      phone: "9999999999",
      password: hashedPassword,
      name: "Super Admin",
      isVerified: true,
    },
  });

  await prisma.adminUser.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: roles["SUPER_ADMIN"].id,
    },
  });

  // Categories
  const categoryData = [
    { name: "Pizza", sortOrder: 1 },
    { name: "Burgers", sortOrder: 2 },
    { name: "Beverages", sortOrder: 3 },
    { name: "Desserts", sortOrder: 4 },
  ];

  const categories: Record<string, { id: string }> = {};
  for (const cat of categoryData) {
    categories[cat.name] = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Food items
  const foodItems = [
    {
      name: "Margherita Pizza",
      description: "Classic cheese and tomato pizza",
      price: 299,
      categoryId: categories["Pizza"].id,
      isVeg: true,
      isFeatured: true,
      isPopular: true,
    },
    {
      name: "Farmhouse Pizza",
      description: "Loaded with garden vegetables",
      price: 349,
      categoryId: categories["Pizza"].id,
      isVeg: true,
      isFeatured: true,
    },
    {
      name: "Classic Cheeseburger",
      description: "Beef patty with cheddar cheese",
      price: 199,
      categoryId: categories["Burgers"].id,
      isVeg: false,
      isPopular: true,
    },
    {
      name: "Veggie Burger",
      description: "Crispy veggie patty burger",
      price: 179,
      categoryId: categories["Burgers"].id,
      isVeg: true,
    },
    {
      name: "Cold Coffee",
      description: "Chilled coffee with ice cream",
      price: 99,
      categoryId: categories["Beverages"].id,
      isVeg: true,
      isPopular: true,
    },
    {
      name: "Chocolate Brownie",
      description: "Warm brownie with chocolate sauce",
      price: 129,
      categoryId: categories["Desserts"].id,
      isVeg: true,
      isFeatured: true,
    },
  ];

  for (const item of foodItems) {
    const existing = await prisma.foodItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.foodItem.create({ data: item });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${config.admin.defaultEmail} / ${config.admin.defaultPassword}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
