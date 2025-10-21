import vision from "@google-cloud/vision"
import { NextResponse } from "next/server"

// Requires GOOGLE_APPLICATION_CREDENTIALS (JSON) or explicit key on Vercel

function getVisionClient() {
  const projectId = process.env.GCP_PROJECT_ID
  const clientEmail = process.env.GCP_CLIENT_EMAIL
  let privateKey = process.env.GCP_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing GCP vision credentials env (GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY)")
  }

  privateKey = privateKey.replace(/\\n/g, "\n")

  return new vision.ImageAnnotatorClient({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  })
}

export async function POST(req: Request): Promise<Response> {
  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expect multipart/form-data" }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get("file") as File | null
    const lang = (form.get("lang") as string) || "auto"
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const client = getVisionClient()
    const [result] = await client.textDetection({
      image: { content: buffer },
      imageContext: lang === "auto" ? undefined : { languageHints: [lang] },
    })
    const annotation = result.fullTextAnnotation
    const text = (annotation?.text || "").trim()
    return NextResponse.json({ text })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


