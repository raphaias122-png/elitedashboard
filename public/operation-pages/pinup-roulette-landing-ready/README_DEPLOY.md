# Pin-Up Roulette Landing

Landing otimizada para mobile com:

- Roleta interativa
- Auto-spin
- Popup final de conversao
- Meta Pixel
- Meta Conversions API
- Imagens WebP otimizadas
- Gzip/cache no servidor Node

## Como subir

Esta versao precisa de hospedagem Node.js para manter o endpoint da Conversions API seguro.

Comandos:

```bash
npm start
```

O servidor usa a porta definida por `PORT` ou `3000`.

## Variaveis de ambiente

Configure na hospedagem:

```bash
META_PIXEL_ID=1981376712481038
META_ACCESS_TOKEN=seu_token_backend
META_API_VERSION=v23.0
```

Opcional para teste no Meta Events Manager:

```bash
META_TEST_EVENT_CODE=TEST12345
```

## Importante

Nao coloque o `META_ACCESS_TOKEN` no HTML, no JavaScript publico ou em hospedagem estatica.

Se subir apenas a pasta `public` em hospedagem estatica, a landing abre, mas a Conversions API nao funciona. Para Pixel + CAPI completo, suba este pacote Node inteiro.
