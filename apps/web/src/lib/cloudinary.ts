const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local"
    )
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const fd = new FormData()
  fd.append("file", file)
  fd.append("upload_preset", UPLOAD_PRESET)

  const res = await fetch(url, { method: "POST", body: fd })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Upload failed (${res.status})`)
  }

  const data = await res.json()
  return data.secure_url as string
}
