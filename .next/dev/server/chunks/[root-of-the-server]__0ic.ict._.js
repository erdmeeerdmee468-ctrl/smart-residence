module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/OneDrive/Desktop/project/smart-residence/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f40$prisma$2b$client$40$6$2e$19$2e$3_prism_4ffd11c130385b632f1988f146a90b26$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/OneDrive/Desktop/project/smart-residence/node_modules/.pnpm/@prisma+client@6.19.3_prism_4ffd11c130385b632f1988f146a90b26/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f40$prisma$2b$client$40$6$2e$19$2e$3_prism_4ffd11c130385b632f1988f146a90b26$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        "error"
    ]
});
if ("TURBOPACK compile-time truthy", 1) {
    globalForPrisma.prisma = prisma;
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/OneDrive/Desktop/project/smart-residence/src/lib/rate-limit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Simple in-memory rate limiting
// Production-д Redis ашиглахыг зөвлөж байна
__turbopack_context__.s([
    "checkRateLimit",
    ()=>checkRateLimit,
    "rateLimitMiddleware",
    ()=>rateLimitMiddleware
]);
const rateLimitStore = new Map();
// Rate limit configuration
const RATE_LIMIT_CONFIG = {
    LOGIN: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000
    },
    API: {
        maxRequests: 100,
        windowMs: 60 * 1000
    }
};
function getClientIdentifier(request) {
    // Get IP from headers (works with most hosting platforms)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";
    return ip;
}
function checkRateLimit(request, type = "API") {
    const clientId = getClientIdentifier(request);
    const key = `${clientId}:${type}`;
    const config = RATE_LIMIT_CONFIG[type];
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetTime) {
        // New window
        const newEntry = {
            count: 1,
            resetTime: now + config.windowMs
        };
        rateLimitStore.set(key, newEntry);
        return {
            success: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - 1,
            resetTime: newEntry.resetTime
        };
    }
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            limit: config.maxRequests,
            remaining: 0,
            resetTime: entry.resetTime
        };
    }
    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);
    return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime
    };
}
function rateLimitMiddleware(request, type = "API") {
    const result = checkRateLimit(request, type);
    if (!result.success) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        return new Response(JSON.stringify({
            message: "Too many requests. Please try again later.",
            retryAfter
        }), {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": String(result.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
                "Retry-After": String(retryAfter)
            }
        });
    }
    return null;
}
// Clean up old entries periodically (every 5 minutes)
if (typeof globalThis !== "undefined") {
    setInterval(()=>{
        const now = Date.now();
        for (const [key, entry] of rateLimitStore){
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}
}),
"[project]/OneDrive/Desktop/project/smart-residence/src/lib/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "announcementSchema",
    ()=>announcementSchema,
    "billSchema",
    ()=>billSchema,
    "chatMessageSchema",
    ()=>chatMessageSchema,
    "forgotPasswordSchema",
    ()=>forgotPasswordSchema,
    "formatZodErrors",
    ()=>formatZodErrors,
    "loginSchema",
    ()=>loginSchema,
    "paginationSchema",
    ()=>paginationSchema,
    "registerSchema",
    ()=>registerSchema,
    "resetPasswordSchema",
    ()=>resetPasswordSchema,
    "residentSchema",
    ()=>residentSchema,
    "safeParse",
    ()=>safeParse,
    "searchSchema",
    ()=>searchSchema,
    "verifyCodeSchema",
    ()=>verifyCodeSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/project/smart-residence/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
// Email validation
const emailSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Имэйл хаяг оруулна уу").email("Имэйл хаяг буруу форматтай байна").max(254, "Имэйл хаяг хэт урт байна");
// Password validation
const passwordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой").max(128, "Нууц үг хэт урт байна").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Нууц үг дор хаяж 1 том үсэг, 1 жижиг үсэг, 1 тоо агуулах ёстой");
// Name validation
const nameSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Нэр оруулна уу").max(100, "Нэр хэт урт байна").regex(/^[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u1800-\u18AF\s'-]+$/, "Нэр буруу форматтай байна");
// Phone validation
const phoneSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\+?[\d\s-]{8,20}$/, "Утасны дугаар буруу форматтай байна");
// ID validation (UUID or cuid)
const idSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "ID оруулна уу").max(100);
const loginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Имэйл оруулна уу").email("Имэйл хаяг буруу форматтай байна"),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Нууц үг оруулна уу")
});
const registerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    phoneNumber: phoneSchema.optional(),
    unitNumber: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(20).optional()
});
const forgotPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: emailSchema
});
const resetPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    token: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Token оруулна уу"),
    password: passwordSchema
});
const verifyCodeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: emailSchema,
    code: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(4).max(10)
});
const paginationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().positive().default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().positive().max(100).default(10),
    sortBy: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    sortOrder: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "asc",
        "desc"
    ]).default("desc")
});
const searchSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    query: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(200)
});
const residentSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: emailSchema,
    name: nameSchema,
    phoneNumber: phoneSchema.optional(),
    unitNumber: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(20),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "ACTIVE",
        "INACTIVE",
        "PENDING"
    ]).default("ACTIVE")
});
const announcementSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(200),
    content: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(5000),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "GENERAL",
        "MAINTENANCE",
        "EMERGENCY"
    ]),
    target: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "ALL",
        "RESIDENTS",
        "SOH"
    ])
});
const billSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    residentId: idSchema,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "WATER",
        "ELECTRICITY",
        "MAINTENANCE",
        "OTHER"
    ]),
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().max(10000000),
    dueDate: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional()
});
const chatMessageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    content: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(2000),
    groupId: idSchema.optional(),
    receiverId: idSchema.optional()
});
function formatZodErrors(error) {
    return error.errors.map((err)=>err.message);
}
function safeParse(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return {
            success: true,
            data: result.data
        };
    }
    return {
        success: false,
        errors: formatZodErrors(result.error)
    };
}
}),
"[project]/OneDrive/Desktop/project/smart-residence/src/app/api/auth/login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/project/smart-residence/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$3$2e$0$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/project/smart-residence/node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/project/smart-residence/src/lib/rate-limit.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/project/smart-residence/src/lib/validation.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(req) {
    try {
        const rateLimitResponse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rateLimitMiddleware"])(req, "LOGIN");
        if (rateLimitResponse) return rateLimitResponse;
        const body = await req.json();
        const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safeParse"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$src$2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loginSchema"], body);
        if (!validation.success) {
            return Response.json({
                message: "Буруу өгөгдөл",
                errors: validation.errors
            }, {
                status: 400
            });
        }
        const { email, password } = validation.data;
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
            where: {
                email
            }
        });
        if (!user) {
            return Response.json({
                message: "Имэйл эсвэл нууц үг буруу байна"
            }, {
                status: 401
            });
        }
        const isValid = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$project$2f$smart$2d$residence$2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$3$2e$0$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(password, user.password);
        if (!isValid) {
            return Response.json({
                message: "Имэйл эсвэл нууц үг буруу байна"
            }, {
                status: 401
            });
        }
        const maxAge = 60 * 60 * 24 * 7;
        const cookieStr = (name, value)=>`${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
        const setCookieHeader = [
            cookieStr("userId", user.id),
            cookieStr("userRole", user.role),
            cookieStr("userName", user.name ?? "")
        ].join(", ");
        return new Response(JSON.stringify({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": setCookieHeader
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return Response.json({
            message: "Серверийн алдаа гарлаа"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ic.ict._.js.map