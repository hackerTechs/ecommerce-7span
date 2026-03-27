import request from "supertest";
import app from "../app";
import prisma from "../config/database";
import { hashPassword } from "../utils/password";
import { generateAccessToken } from "../utils/jwt";
import { ACCESS_TOKEN_COOKIE } from "../constants/auth-cookies";

let token: string;
let userId: number;
let adminToken: string;
let productId: number;
let categoryId: number;

beforeAll(async () => {
  await prisma.$connect();

  // Clean slate
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const category = await prisma.category.create({
    data: { name: "Test Category", description: "For testing" },
  });
  categoryId = category.id;

  const hashed = await hashPassword("test1234");
  const user = await prisma.user.create({
    data: { name: "Test User", email: "order-test@example.com", password: hashed, role: "CUSTOMER" },
  });
  userId = user.id;
  token = generateAccessToken({ userId: user.id, email: user.email, role: "CUSTOMER" });

  const adminUser = await prisma.user.create({
    data: {
      name: "Order Test Admin",
      email: "order-admin-test@example.com",
      password: hashed,
      role: "ADMIN",
    },
  });
  adminToken = generateAccessToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: "ADMIN",
  });
});

afterAll(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

/** Cookie header for admin-only auth checks (customer routes must reject). */
function adminCookie() {
  return `${ACCESS_TOKEN_COOKIE}=${adminToken}`;
}

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();

  const product = await prisma.product.create({
    data: { name: "Test Product", price: 49.99, stock: 10, categoryId },
  });
  productId = product.id;
});

describe("Order Placement — integration tests", () => {
  it("POST /api/orders — should fail with 400 when cart is empty", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cart is empty/i);
  });

  it("POST /api/orders — should place order successfully", async () => {
    // Add item to cart
    await request(app)
      .post("/api/cart/items")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`)
      .send({ productId, quantity: 3 });

    // Place order
    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(Number(res.body.data.totalAmount)).toBeCloseTo(149.97); // 3 × 49.99

    // Verify stock was deducted
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stock).toBe(7); // 10 - 3

    // Verify cart is cleared
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    expect(cart!.items).toHaveLength(0);
  });

  it("POST /api/orders — should snapshot unit price at time of order", async () => {
    await request(app)
      .post("/api/cart/items")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(res.status).toBe(201);
    expect(Number(res.body.data.items[0].unitPrice)).toBeCloseTo(49.99);
  });

  it("POST /api/orders — should fail when stock is insufficient (race condition)", async () => {
    // Add valid quantity to cart
    await request(app)
      .post("/api/cart/items")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`)
      .send({ productId, quantity: 5 });

    // Simulate another user buying all stock between cart-add and order-place
    await prisma.product.update({ where: { id: productId }, data: { stock: 2 } });

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/insufficient stock/i);

    // Stock unchanged — transaction rolled back
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stock).toBe(2);
  });

  it("POST /api/orders — should rollback entirely when one product lacks stock", async () => {
    const inStockProduct = await prisma.product.create({
      data: { name: "In Stock Item", price: 10, stock: 100, categoryId },
    });
    const lowStockProduct = await prisma.product.create({
      data: { name: "Low Stock Item", price: 20, stock: 50, categoryId },
    });

    // Add both to cart (within stock at this point)
    await request(app)
      .post("/api/cart/items")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`)
      .send({ productId: inStockProduct.id, quantity: 2 });

    await request(app)
      .post("/api/cart/items")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`)
      .send({ productId: lowStockProduct.id, quantity: 5 });

    // Simulate race: deplete lowStockProduct after cart was populated
    await prisma.product.update({ where: { id: lowStockProduct.id }, data: { stock: 1 } });

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(res.status).toBe(400);

    // Both products should have unchanged stock (full rollback)
    const p1 = await prisma.product.findUnique({ where: { id: inStockProduct.id } });
    const p2 = await prisma.product.findUnique({ where: { id: lowStockProduct.id } });
    expect(p1!.stock).toBe(100);
    expect(p2!.stock).toBe(1);

    // No order created
    const orders = await prisma.order.findMany({ where: { userId } });
    expect(orders).toHaveLength(0);
  });

  it("POST /api/orders — should reject unauthenticated requests", async () => {
    const res = await request(app).post("/api/orders");

    expect(res.status).toBe(401);
  });

  it("POST /api/orders — should reject ADMIN (customer-only route)", async () => {
    const res = await request(app).post("/api/orders").set("Cookie", adminCookie());

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/cart/items — should reject ADMIN so checkout cannot be prepared", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Cookie", adminCookie())
      .send({ productId, quantity: 1 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("PATCH /api/orders/:id/cancel — should cancel and restore stock", async () => {
    // Add item and place order
    await request(app)
      .post("/api/cart/items")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`)
      .send({ productId, quantity: 4 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.id;

    // Stock should be 6 after order
    let product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stock).toBe(6);

    // Cancel order
    const cancelRes = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("CANCELLED");

    // Stock restored to 10
    product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stock).toBe(10);
  });

  it("PATCH /api/orders/:id/cancel — should reject cancelling non-PENDING order", async () => {
    await request(app)
      .post("/api/cart/items")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`)
      .send({ productId, quantity: 1 });

    const orderRes = await request(app)
      .post("/api/orders")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);
    const orderId = orderRes.body.data.id;

    // Cancel once
    await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    // Try to cancel again
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only pending/i);
  });
});
