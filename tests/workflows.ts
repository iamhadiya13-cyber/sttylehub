/* eslint-disable @typescript-eslint/no-explicit-any */

import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Coupon } from "../src/lib/models/Coupon";
import { CouponRedemption } from "../src/lib/models/CouponRedemption";
import { Order } from "../src/lib/models/Order";
import { Product } from "../src/lib/models/Product";
import { Review } from "../src/lib/models/Review";
import { Seller } from "../src/lib/models/Seller";
import { User } from "../src/lib/models/User";
import {
  calculateCouponDiscountValue,
  validateCouponForContext,
} from "../src/lib/services/coupon.service";
import {
  confirmOrderPayment,
  createOrderForUser,
  validateOrderItemsForUser,
} from "../src/lib/services/order.service";
import { approveReviewById } from "../src/lib/services/review.service";
import { applyOrderInventoryDeductions } from "../src/lib/route-utils";
import {
  approveSellerApplication,
  submitSellerApplication,
} from "../src/lib/services/seller.service";
import { restoreAll, stubMethod } from "./helpers";

function createMockSession() {
  return {
    async withTransaction(fn: () => Promise<void>) {
      await fn();
    },
    async endSession() {},
  };
}

async function run(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function main() {
  await run("coupon validation rejects returning user for new-user coupon", async () => {
    const restorers: Array<() => void> = [];

    try {
      restorers.push(
        stubMethod(Coupon, "findOne", async () => ({
          _id: "coupon-1",
          code: "NEW100",
          isActive: true,
          audienceType: "new_user",
          usageLimit: 0,
          usedCount: 0,
          minOrderAmount: 0,
          perUserLimit: 0,
          discountType: "flat",
          discountValue: 100,
        }) as never),
      );
      restorers.push(stubMethod(Order, "countDocuments", async () => 2 as never));

      await assert.rejects(
        () =>
          validateCouponForContext({
            code: "NEW100",
            cartTotal: 1200,
            session: { user: { id: "user-1", email: "test@example.com" } },
          }),
        /new users only/i,
      );

      assert.equal(
        calculateCouponDiscountValue(
          { discountType: "percentage", discountValue: 25, maxDiscountAmount: 300 },
          2000,
        ),
        300,
      );
    } finally {
      restoreAll(restorers);
    }
  });

  await run("coupon validation blocks per-user reuse for all-audience coupon", async () => {
    const restorers: Array<() => void> = [];

    try {
      restorers.push(
        stubMethod(Coupon, "findOne", async () => ({
          _id: "coupon-1",
          code: "ONCEONLY",
          isActive: true,
          audienceType: "all",
          usageLimit: 0,
          usedCount: 0,
          minOrderAmount: 0,
          perUserLimit: 1,
          discountType: "flat",
          discountValue: 150,
        }) as never),
      );
      restorers.push(stubMethod(Order, "countDocuments", async () => 0 as never));
      restorers.push(
        stubMethod(CouponRedemption, "countDocuments", async () => 1 as never),
      );

      await assert.rejects(
        () =>
          validateCouponForContext({
            code: "ONCEONLY",
            cartTotal: 1200,
            session: { user: { id: "user-1", email: "test@example.com" } },
          }),
        /already used this coupon/i,
      );
    } finally {
      restoreAll(restorers);
    }
  });

  await run("seller workflow promotes approved applicant to seller role", async () => {
    const restorers: Array<() => void> = [];
    let createdSeller: any;
    let updatedRole: string | undefined;

    try {
      restorers.push(
        stubMethod(User, "findById", ((id: string) => ({
          select: async () => ({ _id: id, name: "Test User", email: "test@example.com" }),
        })) as never),
      );
      restorers.push(
        stubMethod(Seller, "findOne", ((query: Record<string, unknown>) => {
          if (query.shopSlug) {
            return { select: async () => null };
          }
          return null;
        }) as never),
      );
      restorers.push(
        stubMethod(Seller, "create", (async (payload: Record<string, unknown>) => {
          createdSeller = {
            _id: "seller-1",
            ...payload,
            save: async () => createdSeller,
          };
          return createdSeller;
        }) as never),
      );
      restorers.push(
        stubMethod(Seller, "findById", ((id: string) => ({
          populate: async () => ({
            _id: id,
            shopName: createdSeller.shopName,
            shopSlug: createdSeller.shopSlug,
            isApproved: false,
            isActive: false,
            save: async function () {
              return this;
            },
            user: {
              _id: "user-1",
              name: "Test User",
              email: "test@example.com",
            },
          }),
        })) as never),
      );
      restorers.push(
        stubMethod(User, "findByIdAndUpdate", (async (_id: string, update: Record<string, any>) => {
          updatedRole = update.$set.role;
          return null;
        }) as never),
      );

      const applied = await submitSellerApplication(
        "user-1",
        {
          shopName: "Night Circuit",
          description: "A long enough brand description for the vendor application flow.",
          shopCategory: "streetwear",
          phone: "9876543210",
          businessType: "individual",
          bankDetails: {
            accountName: "Test User",
            bankName: "Test Bank",
            accountNumber: "1234567890",
            ifscCode: "TEST0001234",
          },
        },
        { notify: false },
      );

      assert.equal(applied.message, "Application submitted successfully!");

      const approved = await approveSellerApplication("seller-1", "507f1f77bcf86cd799439011", {
        notify: false,
      });

      assert.match(approved.message, /approved/i);
      assert.equal(updatedRole, "seller");
    } finally {
      restoreAll(restorers);
    }
  });

  await run("checkout workflow creates order with expected totals", async () => {
    const restorers: Array<() => void> = [];
    let createdOrder: any;

    try {
      restorers.push(stubMethod(mongoose, "startSession", (async () => createMockSession()) as never));
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Oversized Hoodie",
            images: ["/hoodie.jpg"],
            price: 1999,
            discountPrice: 1499,
            seller: "seller-1",
            category: "cat-1",
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                size: "M",
                color: { name: "Black", hex: "#000000" },
                stock: 10,
                sku: "SKU1",
                price: null,
              },
            ],
          },
        ]) as never),
      );
      restorers.push(
        stubMethod(User, "findById", ((id: string) => ({
          select: async () => ({
            _id: id,
            name: "Checkout User",
            email: "buyer@example.com",
            addresses: {
              id: (addressId: string) =>
                addressId === "addr-1"
                  ? {
                      _id: "addr-1",
                      street: "12 Street",
                      city: "Mumbai",
                      state: "MH",
                      pincode: "400001",
                      country: "India",
                    }
                  : null,
            },
          }),
        })) as never),
      );
      restorers.push(stubMethod(Coupon, "findById", (async () => null) as never));
      restorers.push(
        stubMethod(Order, "create", (async (payload: Array<Record<string, unknown>>) => {
          createdOrder = { _id: "order-1", ...payload[0], items: payload[0].items };
          return [createdOrder];
        }) as never),
      );
      restorers.push(stubMethod(Order, "findOne", (async () => null) as never));

      const order = await createOrderForUser(
        "user-1",
        "buyer@example.com",
        {
          items: [{ productId: "prod-1", qty: 2, size: "M", color: "Black" }],
          shippingAddressId: "addr-1",
          paymentMethod: "credit_card",
        },
        {
          shippingResolver: async () => ({ fee: 49, label: "Rs.49", reason: "Standard shipping" }),
        },
      );

      assert.equal(order.total, 3047);
      assert.equal(createdOrder.subtotal, 2998);
      assert.equal(createdOrder.shippingCharge, 49);
      assert.equal(createdOrder.orderStatus, "pending");
    } finally {
      restoreAll(restorers);
    }
  });

  await run("successful payment confirmation consumes coupon exactly once and syncs used count", async () => {
    const restorers: Array<() => void> = [];
    let redemptionWrites = 0;
    let syncedUsedCount: number | undefined;

    try {
      restorers.push(stubMethod(mongoose, "startSession", (async () => createMockSession()) as never));
      restorers.push(
        stubMethod(Product, "find", (() => ({
          session: async () => [
            {
              _id: "prod-1",
              id: "prod-1",
              title: "Coupon Hoodie",
              slug: "coupon-hoodie",
              images: ["/hoodie.jpg"],
              price: 2099,
              discountPrice: 1599,
              seller: "seller-1",
              category: "cat-1",
              isPublished: true,
              acceptedPayments: { razorpay: true, stripe: true, cod: true },
              variants: [
                {
                  _id: "variant-1",
                  size: "M",
                  color: { name: "Black", hex: "#000000" },
                  stock: 10,
                  sku: "COUPON-HOODIE-M-BLK",
                  price: 1599,
                  compareAtPrice: 2099,
                  isActive: true,
                },
              ],
              totalSold: 0,
              totalStock: 10,
              async save() {
                return this;
              },
            },
          ],
        })) as never),
      );
      restorers.push(
        stubMethod(Order, "findById", ((id: string) => ({
          session: async () => ({
            _id: id,
            user: "user-1",
            paymentStatus: "pending",
            orderStatus: "pending",
            discount: 200,
            coupon: "coupon-1",
            items: [
              {
                product: { toString: () => "prod-1" },
                variantId: "variant-1",
                size: "M",
                color: "Black",
                qty: 1,
              },
            ],
            async save() {
              return this;
            },
          }),
        })) as never),
      );
      restorers.push(
        stubMethod(CouponRedemption, "countDocuments", async (query?: Record<string, unknown>) => {
          if (query?.coupon === "coupon-1" && query?.user === "user-1") {
            return 0 as never;
          }
          if (query?.coupon === "coupon-1") {
            return 1 as never;
          }
          return 0 as never;
        }),
      );
      restorers.push(
        stubMethod(CouponRedemption, "updateOne", (async () => {
          redemptionWrites += 1;
          return { upsertedCount: 1 };
        }) as never),
      );
      restorers.push(
        stubMethod(Coupon, "findByIdAndUpdate", (async (_id: string, update: Record<string, any>) => {
          syncedUsedCount = update.$set?.usedCount;
          return null;
        }) as never),
      );
      restorers.push(
        stubMethod(Coupon, "findById", ((id: string) => ({
          select: async () => ({ _id: id, code: "SAVE200" }),
        })) as never),
      );
      restorers.push(
        stubMethod(Product, "findOneAndUpdate", (() => ({
          select: async () => ({ title: "Coupon Hoodie" }),
        })) as never),
      );

      const order = await confirmOrderPayment("order-1", {
        paymentStatus: "paid",
        orderStatus: "confirmed",
      });

      assert.equal(order.paymentStatus, "paid");
      assert.equal(redemptionWrites, 1);
      assert.equal(syncedUsedCount, 1);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("checkout validation flags invalid variant in cart", async () => {
    const restorers: Array<() => void> = [];

    try {
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Oversized Hoodie",
            slug: "oversized-hoodie",
            images: ["/hoodie.jpg"],
            price: 1999,
            discountPrice: 1499,
            seller: "seller-1",
            category: "cat-1",
            isPublished: true,
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                size: "M",
                color: { name: "Black", hex: "#000000" },
                stock: 4,
                sku: "SKU1",
                price: null,
              },
            ],
          },
        ]) as never),
      );

      const result = await validateOrderItemsForUser("user-1", "buyer@example.com", {
        items: [{ productId: "prod-1", qty: 1, size: "XL", color: "Black" }],
        paymentMethod: "credit_card",
      });

      assert.equal(result.invalidItems.length, 1);
      assert.equal(result.invalidItems[0]?.reason, "variant_unavailable");
      assert.equal(result.validItems.length, 0);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("checkout validation flags quantity above stock", async () => {
    const restorers: Array<() => void> = [];

    try {
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Canvas Tote",
            slug: "canvas-tote",
            images: ["/bag.jpg"],
            price: 999,
            discountPrice: 799,
            seller: "seller-1",
            category: "cat-1",
            isPublished: true,
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                size: "One Size",
                color: { name: "White", hex: "#ffffff" },
                stock: 2,
                sku: "SKU2",
                price: null,
              },
            ],
          },
        ]) as never),
      );

      const result = await validateOrderItemsForUser("user-1", "buyer@example.com", {
        items: [{ productId: "prod-1", qty: 4, size: "One Size", color: "White" }],
        paymentMethod: "cod",
      });

      assert.equal(result.invalidItems.length, 1);
      assert.equal(result.invalidItems[0]?.reason, "quantity_exceeds_stock");
      assert.equal(result.invalidItems[0]?.availableStock, 2);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("checkout validation uses exact variant pricing by variantId", async () => {
    const restorers: Array<() => void> = [];

    try {
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Shade Hoodie",
            slug: "shade-hoodie",
            images: ["/hoodie.jpg"],
            price: 3099,
            discountPrice: 2799,
            seller: "seller-1",
            category: "cat-1",
            isPublished: true,
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                _id: "variant-white-m",
                size: "M",
                color: { name: "White", hex: "#ffffff" },
                stock: 4,
                sku: "SHADE-WHT-M",
                price: 2999,
                compareAtPrice: 3299,
                isActive: true,
              },
              {
                _id: "variant-black-m",
                size: "M",
                color: { name: "Black", hex: "#000000" },
                stock: 4,
                sku: "SHADE-BLK-M",
                price: 2899,
                compareAtPrice: 3199,
                isActive: true,
              },
            ],
          },
        ]) as never),
      );

      const result = await validateOrderItemsForUser("user-1", "buyer@example.com", {
        items: [
          {
            productId: "prod-1",
            variantId: "variant-white-m",
            qty: 1,
            size: "M",
            color: "White",
            clientPrice: 3299,
            clientDiscountPrice: 2999,
          },
        ],
        paymentMethod: "credit_card",
      });

      assert.equal(result.invalidItems.length, 0);
      assert.equal(result.validItems[0]?.variantId, "variant-white-m");
      assert.equal(result.validItems[0]?.price, 3299);
      assert.equal(result.validItems[0]?.discountPrice, 2999);
      assert.equal(result.subtotal, 2999);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("order creation rejects invalid items and succeeds after correction", async () => {
    const restorers: Array<() => void> = [];
    let createdOrder: any;

    try {
      restorers.push(stubMethod(mongoose, "startSession", (async () => createMockSession()) as never));
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Oversized Hoodie",
            slug: "oversized-hoodie",
            images: ["/hoodie.jpg"],
            price: 1999,
            discountPrice: 1499,
            seller: "seller-1",
            category: "cat-1",
            isPublished: true,
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                size: "M",
                color: { name: "Black", hex: "#000000" },
                stock: 2,
                sku: "SKU1",
                price: null,
              },
            ],
          },
        ]) as never),
      );
      restorers.push(
        stubMethod(User, "findById", ((id: string) => ({
          select: async () => ({
            _id: id,
            name: "Checkout User",
            email: "buyer@example.com",
            addresses: {
              id: (addressId: string) =>
                addressId === "addr-1"
                  ? {
                      _id: "addr-1",
                      street: "12 Street",
                      city: "Mumbai",
                      state: "MH",
                      pincode: "400001",
                      country: "India",
                    }
                  : null,
            },
          }),
        })) as never),
      );
      restorers.push(
        stubMethod(Order, "create", (async (payload: Array<Record<string, unknown>>) => {
          createdOrder = { _id: "order-1", ...payload[0], items: payload[0].items };
          return [createdOrder];
        }) as never),
      );
      restorers.push(stubMethod(Order, "findOne", (async () => null) as never));

      await assert.rejects(
        () =>
          createOrderForUser("user-1", "buyer@example.com", {
            items: [{ productId: "prod-1", qty: 4, size: "M", color: "Black" }],
            shippingAddressId: "addr-1",
            paymentMethod: "credit_card",
          }),
        (error: any) =>
          error?.code === "INVALID_ORDER_ITEMS" &&
          error?.details?.invalidItems?.[0]?.reason === "quantity_exceeds_stock",
      );

      const order = await createOrderForUser(
        "user-1",
        "buyer@example.com",
        {
          items: [{ productId: "prod-1", qty: 2, size: "M", color: "Black" }],
          shippingAddressId: "addr-1",
          paymentMethod: "credit_card",
        },
        {
          shippingResolver: async () => ({ fee: 49, label: "Rs.49", reason: "Standard shipping" }),
        },
      );

      assert.equal(order.total, 3047);
      assert.equal(createdOrder.items[0].qty, 2);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("admin review approval recalculates product rating aggregates", async () => {
    const restorers: Array<() => void> = [];
    let productUpdate: Record<string, unknown> | undefined;
    const reviewDoc = {
      _id: "review-1",
      product: "product-1",
      rating: 5,
      isApproved: false,
      save: async function () {
        this.isApproved = true;
        return this;
      },
    };

    try {
      restorers.push(stubMethod(Review, "findById", (async () => reviewDoc) as never));
      restorers.push(
        stubMethod(Review, "find", (() => ({
          select: async () => [{ rating: 5 }, { rating: 3 }, { rating: 4 }],
        })) as never),
      );
      restorers.push(
        stubMethod(Product, "findByIdAndUpdate", (async (_id: string, update: Record<string, unknown>) => {
          productUpdate = update;
          return null;
        }) as never),
      );

      const approved = await approveReviewById("review-1");

      assert.equal(approved.isApproved, true);
      assert.deepEqual(productUpdate, {
        averageRating: 4,
        totalReviews: 3,
      });
    } finally {
      restoreAll(restorers);
    }
  });

  await run("inventory deductions update two variants of the same product with one save", async () => {
    const restorers: Array<() => void> = [];
    const productDoc = {
      _id: "prod-1",
      id: "prod-1",
      title: "Dual Tone Hoodie",
      variants: [
        {
          _id: "variant-white",
          size: "M",
          color: { name: "White", hex: "#ffffff" },
          stock: 5,
          sku: "SKU-WHITE-M",
          price: null,
          isActive: true,
        },
        {
          _id: "variant-black",
          size: "M",
          color: { name: "Black", hex: "#000000" },
          stock: 3,
          sku: "SKU-BLACK-M",
          price: null,
          isActive: true,
        },
      ],
      totalSold: 10,
      totalStock: 8,
    };

    try {
      restorers.push(
        stubMethod(Product, "findById", ((id: string) => ({
          select: async () => (id === "prod-1" ? productDoc : null),
        })) as never),
      );
      restorers.push(
        stubMethod(Product, "findOneAndUpdate", ((query: Record<string, unknown>, update: Record<string, unknown>) => {
          const variantId = String(query["variants._id"] ?? "");
          const minimumStock = Number((query["variants.stock"] as { $gte?: number })?.$gte ?? 0);
          const variant = productDoc.variants.find((entry) => entry._id === variantId);

          if (!variant || variant.stock < minimumStock) {
            return null;
          }

          const stockDelta = Number((update.$inc as Record<string, number>)["variants.$.stock"] ?? 0);
          const totalStockDelta = Number((update.$inc as Record<string, number>).totalStock ?? 0);
          const totalSoldDelta = Number((update.$inc as Record<string, number>).totalSold ?? 0);

          variant.stock += stockDelta;
          productDoc.totalStock += totalStockDelta;
          productDoc.totalSold += totalSoldDelta;

          return {
            select: async () => ({ title: productDoc.title }),
          };
        }) as never),
      );

      await applyOrderInventoryDeductions([
        { product: "prod-1", size: "M", color: "White", qty: 2 },
        { product: "prod-1", size: "M", color: "Black", qty: 1 },
      ]);

      assert.equal(productDoc.variants[0]?.stock, 3);
      assert.equal(productDoc.variants[1]?.stock, 2);
      assert.equal(productDoc.totalSold, 13);
      assert.equal(productDoc.totalStock, 5);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("order creation uses variant snapshot prices for two variants from the same product", async () => {
    const restorers: Array<() => void> = [];
    let createdOrder: any;

    try {
      restorers.push(stubMethod(mongoose, "startSession", (async () => createMockSession()) as never));
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Variant Jacket",
            slug: "variant-jacket",
            images: ["/jacket.jpg"],
            price: 3399,
            discountPrice: 2799,
            seller: "seller-1",
            category: "cat-1",
            isPublished: true,
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                _id: "var-black-s",
                size: "S",
                color: { name: "Black", hex: "#000000" },
                stock: 5,
                sku: "JACKET-BLK-S",
                price: 2799,
                compareAtPrice: 3399,
                isActive: true,
              },
              {
                _id: "var-white-m",
                size: "M",
                color: { name: "White", hex: "#ffffff" },
                stock: 5,
                sku: "JACKET-WHT-M",
                price: 2999,
                compareAtPrice: 3499,
                isActive: true,
              },
            ],
          },
        ]) as never),
      );
      restorers.push(
        stubMethod(User, "findById", ((id: string) => ({
          select: async () => ({
            _id: id,
            name: "Checkout User",
            email: "buyer@example.com",
            addresses: {
              id: (addressId: string) =>
                addressId === "addr-1"
                  ? {
                      _id: "addr-1",
                      street: "12 Street",
                      city: "Mumbai",
                      state: "MH",
                      pincode: "400001",
                      country: "India",
                    }
                  : null,
            },
          }),
        })) as never),
      );
      restorers.push(
        stubMethod(Order, "create", (async (payload: Array<Record<string, unknown>>) => {
          createdOrder = { _id: "order-1", ...payload[0], items: payload[0].items };
          return [createdOrder];
        }) as never),
      );
      restorers.push(stubMethod(Order, "findOne", (async () => null) as never));

      const order = await createOrderForUser(
        "user-1",
        "buyer@example.com",
        {
          items: [
            { productId: "prod-1", variantId: "var-black-s", qty: 1, size: "S", color: "Black" },
            { productId: "prod-1", variantId: "var-white-m", qty: 1, size: "M", color: "White" },
          ],
          shippingAddressId: "addr-1",
          paymentMethod: "credit_card",
        },
        {
          shippingResolver: async () => ({ fee: 49, label: "Rs.49", reason: "Standard shipping" }),
        },
      );

      assert.equal(createdOrder.items[0].variantId, "var-black-s");
      assert.equal(createdOrder.items[0].discountPrice, 2799);
      assert.equal(createdOrder.items[0].price, 3399);
      assert.equal(createdOrder.items[1].variantId, "var-white-m");
      assert.equal(createdOrder.items[1].discountPrice, 2999);
      assert.equal(createdOrder.items[1].price, 3499);
      assert.equal(order.subtotal, 5798);
      assert.equal(order.total, 5847);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("checkout validation reserves repeated variant quantities across cart lines", async () => {
    const restorers: Array<() => void> = [];

    try {
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Stacked Tee",
            slug: "stacked-tee",
            images: ["/tee.jpg"],
            price: 999,
            discountPrice: 799,
            seller: "seller-1",
            category: "cat-1",
            isPublished: true,
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                size: "M",
                color: { name: "Black", hex: "#000000" },
                stock: 3,
                sku: "SKU-STACKED-M-BLK",
                price: null,
              },
            ],
          },
        ]) as never),
      );

      const result = await validateOrderItemsForUser("user-1", "buyer@example.com", {
        items: [
          { productId: "prod-1", qty: 2, size: "M", color: "Black" },
          { productId: "prod-1", qty: 2, size: "M", color: "Black" },
        ],
        paymentMethod: "credit_card",
      });

      assert.equal(result.validItems.length, 1);
      assert.equal(result.invalidItems.length, 1);
      assert.equal(result.invalidItems[0]?.reason, "quantity_exceeds_stock");
      assert.equal(result.invalidItems[0]?.availableStock, 1);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("payment confirmation is retry-safe for already paid orders", async () => {
    const restorers: Array<() => void> = [];
    let saveCalls = 0;

    try {
      restorers.push(stubMethod(mongoose, "startSession", (async () => createMockSession()) as never));
      restorers.push(
        stubMethod(Order, "findById", ((id: string) => ({
          session: async () => ({
            _id: id,
            paymentStatus: "paid",
            orderStatus: "confirmed",
            items: [],
            save: async () => {
              saveCalls += 1;
            },
          }),
        })) as never),
      );

      const order = await confirmOrderPayment("order-1", {
        paymentStatus: "paid",
        orderStatus: "confirmed",
      });

      assert.equal(order.paymentStatus, "paid");
      assert.equal(saveCalls, 0);
    } finally {
      restoreAll(restorers);
    }
  });

  await run("coupon is not consumed when order creation fails", async () => {
    const restorers: Array<() => void> = [];
    let redemptionWrites = 0;

    try {
      restorers.push(
        stubMethod(Product, "find", (async () => [
          {
            _id: "prod-1",
            id: "prod-1",
            title: "Broken Stock Tee",
            slug: "broken-stock-tee",
            images: ["/tee.jpg"],
            price: 999,
            discountPrice: 799,
            seller: "seller-1",
            category: "cat-1",
            isPublished: true,
            acceptedPayments: { razorpay: true, stripe: true, cod: true },
            variants: [
              {
                size: "M",
                color: { name: "Black", hex: "#000000" },
                stock: 0,
                sku: "BROKEN-STOCK-M-BLK",
                price: 799,
                compareAtPrice: 999,
                isActive: true,
              },
            ],
          },
        ]) as never),
      );
      restorers.push(
        stubMethod(CouponRedemption, "updateOne", (async () => {
          redemptionWrites += 1;
          return { upsertedCount: 1 };
        }) as never),
      );
      restorers.push(stubMethod(Order, "findOne", (async () => null) as never));

      await assert.rejects(
        () =>
          createOrderForUser("user-1", "buyer@example.com", {
            items: [{ productId: "prod-1", qty: 1, size: "M", color: "Black" }],
            shippingAddressId: "addr-1",
            paymentMethod: "cod",
            couponCode: "SAVE200",
          }),
        /Some products are unavailable/,
      );

      assert.equal(redemptionWrites, 0);
    } finally {
      restoreAll(restorers);
    }
  });

  console.log("All workflow tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
