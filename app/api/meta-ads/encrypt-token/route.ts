import { encryptAccessToken, maskAccessToken } from "../../../../lib/meta-read-only";

export async function POST(request: Request) {
  try {
    const { access_token = "" } = await request.json();
    if (!access_token) return Response.json({ error: "Informe o Access Token." }, { status: 400 });
    return Response.json({
      access_token_encrypted: encryptAccessToken(access_token),
      token_masked: maskAccessToken(access_token),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao proteger token." }, { status: 500 });
  }
}
