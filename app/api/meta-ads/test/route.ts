import { maskAccessToken, validateReadOnlyToken } from "../../../../lib/meta-read-only";
export async function POST(request: Request) {
  try {
    const { access_token = "" } = await request.json();
    if (!access_token) return Response.json({ error: "Informe o Access Token." }, { status: 400 });
    const result = await validateReadOnlyToken(access_token);
    return Response.json({ provider: "meta_ads_read_only", token_masked: maskAccessToken(access_token), status: "connected", permissions: result.granted });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha ao testar conexão." }, { status: 400 }); }
}
