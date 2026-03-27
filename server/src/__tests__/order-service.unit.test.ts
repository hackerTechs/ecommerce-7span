import { OrderService } from "../services/order.service";
import { ApiError } from "../utils/api-error";
import { broadcastStockUpdate } from "../config/socket";
import { bumpCatalogCache } from "../utils/catalog-cache";

jest.mock("../config/socket", () => ({
  broadcastStockUpdate: jest.fn(),
}));

jest.mock("../utils/catalog-cache", () => ({
  bumpCatalogCache: jest.fn().mockResolvedValue(undefined),
}));

/**
 * We mock the entire Prisma module so OrderService.$transaction runs
 * our fake callback synchronously without hitting a real database.
 */

const mockCartFindUnique = jest.fn();
const mockCartItemDeleteMany = jest.fn();
const mockOrderCreate = jest.fn();
const mockExecuteRaw = jest.fn();
const mockProductFindMany = jest.fn();

jest.mock("../config/database", () => {
  const txClient = {
    cart: { findUnique: (...args: unknown[]) => mockCartFindUnique(...args) },
    cartItem: { deleteMany: (...args: unknown[]) => mockCartItemDeleteMany(...args) },
    order: { create: (...args: unknown[]) => mockOrderCreate(...args) },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
  };

  return {
    __esModule: true,
    default: {
      $transaction: (fn: (tx: typeof txClient) => Promise<unknown>) => fn(txClient),
      product: { findMany: (...args: unknown[]) => mockProductFindMany(...args) },
    },
  };
});

function buildCartWithItems(overrides: { stock?: number; quantity?: number; price?: number } = {}) {
  const stock = overrides.stock ?? 10;
  const quantity = overrides.quantity ?? 2;
  const price = overrides.price ?? 25.0;

  return {
    id: 1,
    userId: 1,
    items: [
      {
        id: 101,
        cartId: 1,
        productId: 10,
        quantity,
        product: { id: 10, name: "Widget", price, stock },
      },
      {
        id: 102,
        cartId: 1,
        productId: 20,
        quantity,
        product: { id: 20, name: "Gadget", price, stock },
      },
    ],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (bumpCatalogCache as jest.Mock).mockResolvedValue(undefined);
});

describe("OrderService.placeOrder — unit tests", () => {
  it("should throw 400 when cart is empty", async () => {
    mockCartFindUnique.mockResolvedValue({ id: 1, userId: 1, items: [] });

    await expect(OrderService.placeOrder(1)).rejects.toThrow(ApiError);
    await expect(OrderService.placeOrder(1)).rejects.toMatchObject({
      statusCode: 400,
      message: "Cart is empty",
    });
    expect(broadcastStockUpdate).not.toHaveBeenCalled();
    expect(bumpCatalogCache).not.toHaveBeenCalled();
  });

  it("should throw 400 when cart does not exist", async () => {
    mockCartFindUnique.mockResolvedValue(null);

    await expect(OrderService.placeOrder(1)).rejects.toThrow(ApiError);
    await expect(OrderService.placeOrder(1)).rejects.toMatchObject({
      statusCode: 400,
      message: "Cart is empty",
    });
  });

  it("should throw 400 when product has insufficient stock", async () => {
    const cart = buildCartWithItems({ stock: 1, quantity: 5 });
    mockCartFindUnique.mockResolvedValue(cart);

    await expect(OrderService.placeOrder(1)).rejects.toThrow(ApiError);
    await expect(OrderService.placeOrder(1)).rejects.toMatchObject({
      statusCode: 400,
      message: "Insufficient stock for one or more items",
    });
  });

  it("should throw 400 when raw stock deduction affects 0 rows (race condition)", async () => {
    const cart = buildCartWithItems({ stock: 10, quantity: 2 });
    mockCartFindUnique.mockResolvedValue(cart);
    mockExecuteRaw.mockResolvedValue(0); // simulates concurrent depletion

    await expect(OrderService.placeOrder(1)).rejects.toThrow(ApiError);
    await expect(OrderService.placeOrder(1)).rejects.toMatchObject({
      statusCode: 400,
      message: "Insufficient stock for one or more items",
    });

    expect(mockOrderCreate).not.toHaveBeenCalled();
    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
  });

  it("should create order, deduct stock, and clear cart on success", async () => {
    const cart = buildCartWithItems({ stock: 10, quantity: 2, price: 25 });
    mockCartFindUnique.mockResolvedValue(cart);
    mockExecuteRaw.mockResolvedValue(1);

    const fakeOrder = {
      id: 1,
      userId: 1,
      totalAmount: 100,
      status: "PENDING",
      items: [{ productId: 10 }, { productId: 20 }],
    };
    mockOrderCreate.mockResolvedValue(fakeOrder);
    mockCartItemDeleteMany.mockResolvedValue({ count: 2 });
    mockProductFindMany.mockResolvedValue([
      { id: 10, stock: 6 },
      { id: 20, stock: 6 },
    ]);

    const result = await OrderService.placeOrder(1);

    expect(result).toEqual(fakeOrder);

    expect(broadcastStockUpdate).toHaveBeenCalledWith([
      { id: 10, stock: 6 },
      { id: 20, stock: 6 },
    ]);
    expect(bumpCatalogCache).toHaveBeenCalledTimes(1);

    // Stock deducted for each item
    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);

    // Order created with correct total (2 items × qty 2 × ₹25 = ₹100)
    expect(mockOrderCreate).toHaveBeenCalledTimes(1);
    const createArgs = mockOrderCreate.mock.calls[0][0];
    expect(createArgs.data.totalAmount).toBe(100);
    expect(createArgs.data.items.create).toHaveLength(2);

    // Unit price snapshot captured
    expect(createArgs.data.items.create[0].unitPrice).toBe(25);

    // Cart cleared
    expect(mockCartItemDeleteMany).toHaveBeenCalledWith({ where: { cartId: 1 } });
  });

  it("should calculate total correctly with different prices", async () => {
    const cart = {
      id: 1,
      userId: 1,
      items: [
        {
          id: 101, cartId: 1, productId: 10, quantity: 3,
          product: { id: 10, name: "A", price: 10.5, stock: 50 },
        },
        {
          id: 102, cartId: 1, productId: 20, quantity: 1,
          product: { id: 20, name: "B", price: 99.99, stock: 50 },
        },
      ],
    };
    mockCartFindUnique.mockResolvedValue(cart);
    mockExecuteRaw.mockResolvedValue(1);
    mockOrderCreate.mockResolvedValue({
      id: 2,
      items: [{ productId: 10 }, { productId: 20 }],
    });
    mockCartItemDeleteMany.mockResolvedValue({ count: 2 });
    mockProductFindMany.mockResolvedValue([
      { id: 10, stock: 47 },
      { id: 20, stock: 49 },
    ]);

    await OrderService.placeOrder(1);

    const createArgs = mockOrderCreate.mock.calls[0][0];
    // 3 × 10.5 + 1 × 99.99 = 131.49
    expect(createArgs.data.totalAmount).toBeCloseTo(131.49);
  });

  it("should NOT clear cart if stock deduction fails mid-way", async () => {
    const cart = buildCartWithItems({ stock: 10, quantity: 2 });
    mockCartFindUnique.mockResolvedValue(cart);
    // First product succeeds, second fails
    mockExecuteRaw.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(OrderService.placeOrder(1)).rejects.toThrow(ApiError);
    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });
});
