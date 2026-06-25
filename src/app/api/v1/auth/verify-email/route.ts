// POST /api/v1/auth/verify-email — token ile e-posta doğrulama (O-4).
import { ok, handle } from "@/lib/api";
import { verifyEmailToken } from "@/lib/email-verification";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(10) });

export const POST = handle(async (req) => {
  const { token } = schema.parse(await req.json());
  await verifyEmailToken(token);
  return ok({ message: "E-postanız doğrulandı" });
});
