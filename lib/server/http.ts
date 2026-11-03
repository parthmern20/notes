import mongoose from "mongoose"
import { NextResponse } from "next/server"
import { ZodError, type ZodType } from "zod"
import { resolveTimeZone } from "@/lib/dates"
import { connectDB, DatabaseConfigError } from "./db"

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

function isConnectionError(err: unknown): boolean {
  if (err instanceof DatabaseConfigError) return true
  const name = (err as { name?: string } | null)?.name ?? ""
  return /MongooseServerSelectionError|MongoServerSelectionError|MongoNetworkError/.test(name) || (err as { syscall?: string })?.syscall === "querySrv"
}

function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message, details: err.details }, { status: err.status })
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    const first = details[0]
    return NextResponse.json(
      { error: first ? `${first.path ? first.path + ": " : ""}${first.message}` : "Invalid request", details },
      { status: 400 },
    )
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
  if (err instanceof mongoose.Error.CastError) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (isConnectionError(err)) {
    console.error("[db]", err)
    const message =
      err instanceof DatabaseConfigError
        ? err.message
        : "Can't reach the database. Check MONGODB_URI, your network and the Atlas IP access list."
    return NextResponse.json({ error: message }, { status: 503 })
  }
  console.error("[api]", err)
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
}

/** Wraps a route handler: connects to the database (unless `db: false`) and maps thrown errors to JSON responses. */
export function route<Ctx>(handler: (req: Request, ctx: Ctx) => Promise<Response>, { db = true } = {}) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      if (db) await connectDB()
      return await handler(req, ctx)
    } catch (err) {
      return errorResponse(err)
    }
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export async function readJson<T>(req: Request, schema: ZodType<T>, maxBytes = 12 * 1024 * 1024): Promise<T> {
  const length = Number(req.headers.get("content-length") ?? 0)
  if (length > maxBytes) throw new HttpError(413, "This note is too large. Try smaller images.")
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new HttpError(400, "Request body must be valid JSON")
  }
  return schema.parse(body)
}

export function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new HttpError(404, "Not found")
  return new mongoose.Types.ObjectId(id)
}

export function timeZoneOf(req: Request): string {
  return resolveTimeZone(req.headers.get("x-timezone"))
}

export type IdContext = { params: Promise<{ id: string }> }
