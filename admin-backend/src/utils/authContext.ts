import jwt from "jsonwebtoken";

export function getUserIdFromContext(ctx: {
    req?: {
        session?: { userId?: number };
        headers?: { authorization?: string };
    };
    user?: { id?: number } | null;
}): number | null {
    if (ctx.user?.id) {
        return ctx.user.id;
    }

    if (ctx.req?.session?.userId) {
        return ctx.req.session.userId;
    }

    const authHeader = ctx.req?.headers?.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
            const decoded = jwt.verify(
                token,
                process.env.ADMIN_JWT_SECRET ||
                    process.env.JWT_SECRET ||
                    "admin-secret-key"
            ) as { userId?: number };
            if (decoded.userId) {
                return decoded.userId;
            }
        } catch {
            return null;
        }
    }

    return null;
}
