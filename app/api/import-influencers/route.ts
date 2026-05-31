export async function POST(request: Request) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return Response.json({ error: "Configure APIFY_API_TOKEN para ativar a importação." }, { status: 503 });
  const { handles = [] } = await request.json();
  return Response.json({
    provider: "apify",
    configured: true,
    handles,
    message: "Integração preparada. Configure o Actor escolhido para coletar os perfis públicos.",
  });
}
