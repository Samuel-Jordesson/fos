# Fórum (Next.js + MySQL)

1. Preencha `.env.local` com os dados do MySQL remoto (veja `.env.example`).
2. `npm install` e depois `npm run dev`, e abra http://localhost:3000
3. As tabelas (`users`, `rooms`, `messages`) são criadas sozinhas no primeiro acesso.

## Deploy na Vercel
- Suba o projeto pro GitHub e importe na Vercel.
- Em Settings → Environment Variables, adicione as mesmas variáveis do `.env.local`.
- O MySQL precisa aceitar conexões externas (de qualquer IP, pois a Vercel não tem IP fixo).
