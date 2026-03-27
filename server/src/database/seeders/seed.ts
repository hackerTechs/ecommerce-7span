import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../../utils/password";

const prisma = new PrismaClient();

const CATEGORY_DEFS = [
  { name: "Audio", description: "Headphones, speakers, and audio accessories" },
  { name: "Peripherals", description: "Keyboards, mice, and input devices" },
  { name: "Accessories", description: "Hubs, adapters, cables, and stands" },
  { name: "Displays", description: "Monitors and display equipment" },
  { name: "Storage", description: "SSDs, hard drives, and storage devices" },
  { name: "Office", description: "Desk lamps, webcams, and office essentials" },
] as const;

const BRANDS = [
  "Boat",
  "Noise",
  "JBL",
  "Philips",
  "Portronics",
  "Mi",
  "Realme",
  "Zebronics",
  "Infinity",
  "Sony",
  "Lenovo",
  "HP",
  "Dell",
  "Asus",
  "Logitech",
  "Cosmic Byte",
  "Ant Esports",
  "Redgear",
  "EvoFox",
  "Ambrane",
];

const PRODUCT_LINES = [
  "Airdopes Pro",
  "Rockerz Wireless",
  "BassHeads Wired",
  "Stone Speaker",
  "Soundbar Mini",
  "Neckband Flex",
  "TWS Elite",
  "ANC Studio",
  "RGB Mech Keyboard",
  "Silent Mouse",
  "Ergo Vertical Mouse",
  "Gaming Pad XL",
  "USB-C Hub 7-in-1",
  "HDMI Switch 4K",
  "Thunderbolt Dock",
  "SD Card Reader",
  "Laptop Stand Alloy",
  "Monitor Arm Single",
  "Webcam 1080p",
  "Ring Light 10\"",
  "IPS Monitor 24\"",
  "Curved Gaming 27\"",
  "Portable Monitor 15\"",
  "USB-C Display",
  "Portable SSD 512GB",
  "NVMe Enclosure",
  "HDD Docking",
  "Flash Drive 256GB",
  "microSD Pack",
  "NAS HDD 4TB",
  "Desk Lamp LED",
  "Surge Protector 6A",
  "Extension Cord 3m",
  "Wireless Charger 15W",
  "Fast Charger 65W",
  "Power Bank 20Ah",
  "Bluetooth Adapter",
  "WiFi Dongle AC",
  "Ethernet USB",
  "Laptop Sleeve",
  "Tempered Glass Kit",
  "Active Stylus",
  "Tablet Folio",
  "Headphone Hanger",
  "Cable Sleeve Pack",
  "Thermal Paste",
  "Laptop Cooler",
  "Foot Rest Foam",
  "Wrist Rest Gel",
  "Mic Boom Arm",
  "Pop Filter Mesh",
  "XLR Cable 5m",
  "Audio Interface USB",
  "MIDI Pad Mini",
  "Studio Monitor 5\"",
  "Subwoofer 8\"",
  "RCA Cable Gold",
  "Optical Cable 2m",
  "AUX Braided 1.5m",
  "Car Mount MagSafe",
  "Bike Phone Holder",
  "Selfie Stick Tripod",
  "Gimbal Phone",
  "Smart Plug WiFi",
  "LED Strip RGB",
  "Label Maker",
  "Document Scanner",
  "Barcode Scanner",
  "POS Customer Display",
  "Thermal Receipt Printer",
  "Cash Drawer 12\"",
  "Office Chair Mat",
  "Whiteboard Marker Set",
  "Desk Organizer Mesh",
  "Monitor Privacy Filter",
  "Blue Light Clip-on",
  "Webcam Cover 3pk",
  "Screen Cleaning Kit",
  "Air Duster Electric",
  "Vacuum Mini USB",
  "Keyboard Dust Brush",
  "Mouse Skates PTFE",
  "Keycap Puller Kit",
  "Switch Lube 5ml",
  "Coiled USB-C Cable",
  "Braided Lightning Cable",
  "MagSafe Wallet",
  "Phone Grip Ring",
  "SIM Ejector 5pk",
  "OTG Adapter C",
  "HDMI to VGA",
  "DP to HDMI",
  "USB Hub Powered",
  "Card Reader USB-C",
  "Docking Vertical",
  "Laptop Lock Cable",
  "Privacy Webcam Slide",
  "Noise Isolating Pads",
  "Speaker Spikes Set",
  "Vibration Pad Sub",
  "Wall Mount Speaker",
  "Ceiling Bracket TV",
  "HDMI Wall Plate",
  "Cable Raceway 2m",
  "Velcro Tie 50pk",
  "Zip Tie Assorted",
  "Heat Shrink Kit",
  "Crimping Tool RJ45",
  "Network Tester",
  "Punch Down Tool",
  "Fiber Cleaner Pen",
  "UPS 600VA",
  "Voltage Stabilizer 1kVA",
  "Inverter Battery 150Ah",
  "Solar Lantern LED",
  "Rechargeable Fan USB",
  "Mini Fridge 10L",
  "Humidifier Desk",
  "Air Purifier HEPA",
];

function buildProductRows(categoryMap: Record<string, number>) {
  const catKeys = CATEGORY_DEFS.map((c) => c.name);
  const rows: Array<{
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: number;
    imageUrl: string;
  }> = [];

  for (let i = 0; i < 100; i++) {
    const brand = BRANDS[i % BRANDS.length];
    const line = PRODUCT_LINES[i % PRODUCT_LINES.length];
    const catName = catKeys[i % catKeys.length];
    const name = `${brand} ${line} 7S ${i + 1}`;
    const price = 199 + ((i * 7919) % 48_800) + (i % 97) / 100;
    const stock = 5 + ((i * 17) % 195);

    rows.push({
      name,
      description: `${name} — reliable build, suited for Indian power conditions. Includes standard warranty support.`,
      price: Math.round(price * 100) / 100,
      stock,
      categoryId: categoryMap[catName]!,
      imageUrl: `https://picsum.photos/seed/7span-product-${i+1}/500/500`,
    });
  }

  return rows;
}

async function main() {
  console.log("Seeding database...");

  const password = await hashPassword("Pass123!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  const customer = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@example.com",
      password,
      role: Role.CUSTOMER,
    },
  });
  console.log(`Created customer: ${customer.email}`);

  const categoryMap: Record<string, number> = {};
  for (const cat of CATEGORY_DEFS) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap[created.name] = created.id;
    console.log(`Created category: ${created.name}`);
  }

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  console.log("Cleared orders, carts, and products for fresh catalog.");

  const productRows = buildProductRows(categoryMap);
  await prisma.product.createMany({ data: productRows });
  console.log(`Created ${productRows.length} products (INR pricing, image per product).`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
