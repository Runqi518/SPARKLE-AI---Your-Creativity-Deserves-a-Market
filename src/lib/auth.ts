import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { DataTypes, Op } from "sequelize";
import { z } from "zod";
import { sequelize, syncDatabase } from "./db";
import { databaseWrite } from "./db/migrations";
import { LOCAL_OWNER, withActor, type Actor } from "./actor";
import { errorResponse, StudioError } from "./studio/http";

const scrypt = promisify(scryptCallback);
export const User = sequelize.models.User || sequelize.define("User", {
  id: { type: DataTypes.STRING, primaryKey: true }, email: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.TEXT, allowNull: false }, name: DataTypes.STRING,
  admin: { type: DataTypes.BOOLEAN, defaultValue: false },
});
export const Session = sequelize.models.Session || sequelize.define("Session", {
  id: { type: DataTypes.STRING, primaryKey: true }, userId: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
});
const credentials = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()), password: z.string().min(12).max(200), name: z.string().trim().min(1).max(100).optional() }).strict();
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const attempts = new Map<string, { count: number; expires: number }>();
export function rateLimit(key: string, limit = 120, milliseconds = 60000) {
  const now = Date.now();
  if (attempts.size > 10000) for (const [id, entry] of attempts) if (entry.expires <= now) attempts.delete(id);
  const entry = attempts.get(key);
  if (entry && entry.expires > now) { if (++entry.count > limit) throw new StudioError("Too many requests. Try again later.", 429); }
  else attempts.set(key, { count: 1, expires: now + milliseconds });
}
export async function authenticate(request?: Request): Promise<Actor> {
  await syncDatabase();
  const token = request?.headers.get("cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith("sparkle_session="))?.slice(16);
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const session = await Session.findOne({ where: { id: digest(token), expiresAt: { [Op.gt]: new Date() } } });
    if (session) {
      const user = await User.findByPk(String(session.get("userId")));
      if (user) return { id: String(user.get("id")), admin: Boolean(user.get("admin")) };
    }
  }
  if (process.env.SPARKLE_AUTH_MODE === "accounts") throw new StudioError("Sign in to access this workspace.", 401);
  if (request && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)) throw new StudioError("Remote access requires account authentication.", 401);
  return { id: LOCAL_OWNER, admin: true };
}
export async function signIn(raw: unknown, register: boolean) {
  const parsed = credentials.safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await syncDatabase();
  const { email, password, name } = parsed.data;
  rateLimit("auth:global", 100, 60000);
  rateLimit(`login:${email}`, 10, 15 * 60000);
  let user;
  if (register) {
    user = await databaseWrite(() => sequelize.transaction(async transaction => {
      const count = await User.count({ transaction });
      if (count && process.env.SPARKLE_ALLOW_REGISTRATION !== "true") throw new StudioError("Registration is disabled.", 403);
      if (await User.findOne({ where: { email }, transaction })) throw new StudioError("Account already exists.", 409);
      const salt = randomBytes(16).toString("hex");
      const hash = (await scrypt(password, salt, 64) as Buffer).toString("hex");
      return User.create({ id: count ? randomUUID() : LOCAL_OWNER, email, name: name || email, passwordHash: `${salt}:${hash}`, admin: count === 0 }, { transaction });
    }));
  } else {
    user = await User.findOne({ where: { email } });
    const [salt, hash] = String(user?.get("passwordHash") || `${"0".repeat(32)}:${"0".repeat(128)}`).split(":");
    const supplied = await scrypt(password, salt, 64) as Buffer;
    if (!user || !timingSafeEqual(supplied, Buffer.from(hash, "hex"))) throw new StudioError("Invalid email or password.", 401);
  }
  const token = randomBytes(32).toString("hex");
  await Session.destroy({ where: { expiresAt: { [Op.lte]: new Date() } } });
  await Session.create({ id: digest(token), userId: user.get("id"), expiresAt: new Date(Date.now() + 7 * 86400000) });
  return { token, user: { id: user.get("id"), email: user.get("email"), name: user.get("name") } };
}
export async function signOut(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith("sparkle_session="))?.slice(16);
  if (token) { await syncDatabase(); await Session.destroy({ where: { id: digest(token) } }); }
}

// Resource queries run inside this actor context; model hooks add owner constraints.
export function api<T extends unknown[]>(handler: (request: Request, ...args: T) => Promise<Response>) {
  return async (request: Request, ...args: T) => {
    try {
      const actor = await authenticate(request);
      rateLimit(`api:${actor.id}`, Number(process.env.SPARKLE_API_REQUESTS_PER_MINUTE || 600));
      if (request && !["GET", "HEAD"].includes(request.method)) {
        const origin = request.headers.get("origin");
        if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new StudioError("Cross-origin submission is not allowed.", 403);
      }
      return await withActor(actor, () => handler(request, ...args));
    } catch (error) { return errorResponse(error); }
  };
}
