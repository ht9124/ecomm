// GET /api/docs — OpenAPI 3.1 spesifikasyonu (Swagger UI bu JSON'u tüketir).
// /docs sayfası bu spec'i Swagger UI ile görselleştirir.
import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "E-Comm API",
    version: "1.0.0",
    description: "E-ticaret platformu REST API (v1). Misafir checkout, ödeme, sipariş takibi.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/products": {
      get: {
        summary: "Ürünleri listele (filtre, arama, sıralama, sayfalama)",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc", "popular"] } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Ürün listesi + sayfalama" } },
      },
    },
    "/products/{slug}": {
      get: {
        summary: "Ürün detayı",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Ürün detayı" }, "404": { description: "Bulunamadı" } },
      },
    },
    "/categories": { get: { summary: "Kategori ağacı", responses: { "200": { description: "OK" } } } },
    "/cart": {
      get: { summary: "Sepeti getir", responses: { "200": { description: "Sepet görünümü" } } },
      post: { summary: "Sepete ürün ekle", responses: { "200": { description: "Güncel sepet" } } },
      patch: { summary: "Sepet adedini güncelle", responses: { "200": { description: "Güncel sepet" } } },
    },
    "/cart/coupon": {
      post: { summary: "Kupon uygula", responses: { "200": { description: "OK" } } },
      delete: { summary: "Kuponu kaldır", responses: { "200": { description: "OK" } } },
    },
    "/checkout": {
      post: {
        summary: "Sipariş oluştur + ödeme başlat (misafir/üye)",
        responses: { "200": { description: "Ödeme yönlendirme bilgisi" } },
      },
    },
    "/orders/{orderNumber}": {
      get: {
        summary: "Sipariş takibi (misafir için ?email= zorunlu)",
        parameters: [{ name: "orderNumber", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Sipariş durumu" }, "403": { description: "Yetkisiz" } },
      },
    },
    "/auth/register": { post: { summary: "Kayıt", responses: { "200": { description: "OK" } } } },
    "/auth/login": { post: { summary: "Giriş", responses: { "200": { description: "OK" } } } },
    "/auth/logout": { post: { summary: "Çıkış", responses: { "200": { description: "OK" } } } },
    "/auth/refresh": { post: { summary: "Token yenile", responses: { "200": { description: "OK" } } } },
    "/auth/forgot-password": { post: { summary: "Parola sıfırlama talebi", responses: { "200": { description: "OK" } } } },
    "/auth/reset-password": { post: { summary: "Parola sıfırla", responses: { "200": { description: "OK" } } } },
    "/admin/products": {
      get: { summary: "[ADMIN] Ürünler", responses: { "200": { description: "OK" } } },
      post: { summary: "[ADMIN] Ürün ekle", responses: { "201": { description: "Oluşturuldu" } } },
    },
    "/webhooks/payment": {
      post: { summary: "Ödeme webhook (imza doğrulamalı, idempotent)", responses: { "200": { description: "OK" } } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      cookieAuth: { type: "apiKey", in: "cookie", name: "access_token" },
    },
  },
};

export function GET() {
  return NextResponse.json(spec);
}
