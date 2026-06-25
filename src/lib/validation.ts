// Zod şemaları — TÜM girdi backend'de doğrulanır (frontend'e güvenilmez).
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Parola en az 8 karakter olmalı"),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  marketingConsent: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export const addressSchema = z.object({
  title: z.string().min(1).max(40),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(80),
  district: z.string().min(2).max(80),
  postalCode: z.string().min(3).max(12),
  country: z.string().length(2).default("TR"),
  isDefault: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const cartUpdateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(99), // 0 => kaldır
});

export const applyCouponSchema = z.object({
  code: z.string().min(2).max(40),
});

// Misafir checkout dahil sipariş oluşturma.
export const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  shippingAddress: addressSchema.omit({ title: true, isDefault: true }),
  billingAddress: addressSchema.omit({ title: true, isDefault: true }).optional(),
  couponCode: z.string().max(40).optional(),
  paymentProvider: z.enum(["iyzico", "stripe"]).optional(),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(60).optional().default(12),
});

export const productCreateSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  description: z.string().min(1),
  sku: z.string().min(1).max(60),
  price: z.number().positive(),
  compareAt: z.number().positive().optional(),
  taxRate: z.number().min(0).max(1).default(0.2),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().min(1),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
