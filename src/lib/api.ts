// API yanıt yardımcıları — tutarlı JSON sözleşmesi ve hata biçimi.
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { message, details } },
    { status }
  );
}

// Route handler'ları sarmalar: validasyon ve beklenmeyen hataları standartlaştırır.
export function handle(
  fn: (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>
) {
  return async (req: Request, ctx: { params: Record<string, string> }) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail("Doğrulama hatası", 422, err.flatten());
      }
      if (err instanceof ApiError) {
        return fail(err.message, err.status, err.details);
      }
      // Production'da Sentry'ye gönderilir; burada loglanır.
      console.error("[API ERROR]", err);
      return fail("Sunucu hatası", 500);
    }
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public details?: unknown
  ) {
    super(message);
  }
}
