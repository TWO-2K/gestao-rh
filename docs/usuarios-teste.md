# Usuários de teste (ambiente local)

Contas de demonstração criadas por `scripts/seed-demo.mjs` (Supabase local).
Senha padrão para todos, salvo indicação contrária: `Demo@12345`.

| Nome      | Perfil (papel)            | E-mail                      | Senha         | Observação |
|-----------|----------------------------|------------------------------|---------------|------------|
Lanna `gestor` (RH) lanna@maisbarato.demo lanna.123 Vê/gerencia vagas de todas as unidades 
Vinícius `diretoria` (Portal do Gestor) vinicius@maisbarato.demo vinicius.123 Só solicita vaga para a unidade Alcindo Cacela, vinculado ao funcionário "Vinícius" 
Shelly `recrutador` (RH) shelly@maisbarato.demo shelly.123 Unidades: CD Corporativo, CD Logística |

Outras contas já existentes no seed (não pedidas, mas disponíveis para teste):

| Nome     | Perfil        | E-mail                      | Senha       |
|----------|---------------|------------------------------|-------------|
| Kevin    | `admin`       | kevinkleyoficial@gmail.com   | 325760022   |
| Daniele  | `recrutador`  | daniele@maisbarato.demo      | Demo@12345  |
| Cleise   | `recrutador`  | cleise@maisbarato.demo       | Demo@12345  |
| Beatriz  | `recrutador`  | beatriz@maisbarato.demo      | Demo@12345  |

## Como (re)criar essas contas

```
node scripts/seed-demo.mjs
```

Requer `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apontando
para o Supabase local (`npx supabase start`). O script é idempotente: se o usuário já existe,
apenas atualiza o perfil (nome/papel/funcionário vinculado) em vez de recriar.

> Apenas contas de demonstração para desenvolvimento local — não usar em produção.
