// Seed de demonstração: cria usuários (admin + recrutadoras) e vagas mock
// usando o Supabase local. Não contém nenhum dado real de candidatos/funcionários.
//
// Uso: node scripts/seed-demo.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // sem .env.local, assume variáveis já exportadas no shell
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local)");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SENHA_DEMO = "Demo@12345";

const USUARIOS = [
  { email: "kevinkleyoficial@gmail.com", nome: "Kevin", papel: "admin", unidades: [], senha: "325760022" },
  { email: "lanna@maisbarato.demo", nome: "Lanna", papel: "recrutador", unidades: [] },
  { email: "daniele@maisbarato.demo", nome: "Daniele", papel: "recrutador", unidades: ["Alcindo Cacela"] },
  { email: "cleise@maisbarato.demo", nome: "Cleise", papel: "recrutador", unidades: ["Matriz", "Grão Pará"] },
  { email: "beatriz@maisbarato.demo", nome: "Beatriz", papel: "recrutador", unidades: ["MB Food", "Obra"] },
  { email: "shelly@maisbarato.demo", nome: "Shelly", papel: "recrutador", unidades: ["CD Corporativo", "CD Logística"] },
];

async function upsertFuncionarioDoUsuario({ nome, unidadeId }) {
  const { data: existente } = await admin
    .from("funcionarios")
    .select("id")
    .eq("nome", nome)
    .maybeSingle();
  if (existente) return existente.id;

  const { data, error } = await admin
    .from("funcionarios")
    .insert({ nome, unidade_id: unidadeId ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertUsuario({ email, nome, papel, senha }, funcionarioId) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existente = list?.users.find((u) => u.email === email);
  if (existente) {
    console.log(`Usuário já existe: ${email}`);
    await admin.from("profiles").update({ nome, papel, funcionario_id: funcionarioId }).eq("id", existente.id);
    return existente.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha ?? SENHA_DEMO,
    email_confirm: true,
    user_metadata: { nome, papel },
  });
  if (error) throw error;
  await admin.from("profiles").update({ funcionario_id: funcionarioId }).eq("id", data.user.id);
  console.log(`Usuário criado: ${email}`);
  return data.user.id;
}

async function main() {
  const { data: unidades, error: errUnidades } = await admin.from("unidades").select("id, nome");
  if (errUnidades) throw errUnidades;
  const unidadeIdPorNome = Object.fromEntries(unidades.map((u) => [u.nome, u.id]));

  const { data: cargosComSetor, error: errCargos } = await admin
    .from("cargo_setor")
    .select("cargo_id, setor_id, cargos(nome), setores(nome)")
    .limit(500);
  if (errCargos) throw errCargos;

  const { data: funcionarios, error: errFuncionarios } = await admin
    .from("funcionarios")
    .select("id, nome");
  if (errFuncionarios) throw errFuncionarios;
  const funcionarioIdPorNome = Object.fromEntries(funcionarios.map((f) => [f.nome, f.id]));

  const usuarioIdPorNome = {};
  for (const usuario of USUARIOS) {
    const unidadeId = unidadeIdPorNome[usuario.unidades[0]];
    const funcionarioId = await upsertFuncionarioDoUsuario({ nome: usuario.nome, unidadeId });
    const id = await upsertUsuario(usuario, funcionarioId);
    usuarioIdPorNome[usuario.nome] = id;

    if (usuario.unidades.length > 0) {
      const rows = usuario.unidades
        .map((nomeUnidade) => unidadeIdPorNome[nomeUnidade])
        .filter(Boolean)
        .map((unidade_id) => ({ profile_id: id, unidade_id }));
      if (rows.length > 0) {
        await admin.from("profile_unidades").upsert(rows, { onConflict: "profile_id,unidade_id" });
      }
    }
  }

  const { count } = await admin.from("vagas").select("id", { count: "exact", head: true });
  if (count && count > 0) {
    console.log(`Já existem ${count} vagas, pulando geração de mock.`);
    return;
  }

  const motivos = ["substituicao", "aumento_de_quadro"];
  const recrutadoresNomes = ["Daniele", "Cleise", "Beatriz", "Shelly"];
  const gestores = ["Edimilson", "Gabio", "Vinícius", "Ana Cardias", "Alex Silva", "Cristina"];

  function dataHaDias(dias) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().slice(0, 10);
  }

  const vagasMock = [];
  const unidadesNomes = Object.keys(unidadeIdPorNome);

  for (let i = 0; i < 28; i++) {
    const unidadeNome = unidadesNomes[i % unidadesNomes.length];
    const combo = cargosComSetor[(i * 7) % cargosComSetor.length];
    const recrutadorNome = recrutadoresNomes[i % recrutadoresNomes.length];
    const diasAbertura = [5, 12, 25, 40, 60][i % 5];
    const slaDias = 20;

    const perfil = {
      unidade_id: unidadeIdPorNome[unidadeNome],
      cargo_id: combo.cargo_id,
      setor_id: combo.setor_id,
      motivo: motivos[i % motivos.length],
      gestor_id: funcionarioIdPorNome[gestores[i % gestores.length]] ?? null,
      justificativa: "Vaga de demonstração gerada pelo seed do sistema.",
      data_abertura: dataHaDias(diasAbertura),
      sla_dias: slaDias,
      recrutador_id: usuarioIdPorNome[recrutadorNome],
      horario_trabalho: i % 2 === 0 ? "08h às 18h" : "14h10 às 22h30",
      suspensa: false,
      data_fechamento: null,
      data_admissao: null,
      data_cancelamento: null,
      candidato_aprovado: null,
      motivo_suspensao: null,
    };

    if (i % 6 === 0) {
      // fechada, já admitida (gera períodos de experiência)
      vagasMock.push({
        ...perfil,
        situacao: "fechado",
        candidato_aprovado: `Candidato Demo ${i + 1}`,
        data_fechamento: dataHaDias(diasAbertura - 10 > 0 ? diasAbertura - 10 : 1),
        data_admissao: dataHaDias(diasAbertura - 8 > 0 ? diasAbertura - 8 : 1),
      });
    } else if (i % 11 === 0) {
      vagasMock.push({
        ...perfil,
        situacao: "cancelado",
        data_cancelamento: dataHaDias(2),
      });
    } else if (i % 9 === 0) {
      vagasMock.push({ ...perfil, situacao: "em_aberto", suspensa: true, motivo_suspensao: "Aguardando definição orçamentária" });
    } else {
      vagasMock.push({ ...perfil, situacao: "em_aberto" });
    }
  }

  const { error: errInsert } = await admin.from("vagas").insert(vagasMock);
  if (errInsert) throw errInsert;
  console.log(`${vagasMock.length} vagas de demonstração criadas.`);
  console.log(`\nLogin de teste: lanna@maisbarato.demo / ${SENHA_DEMO} (admin diretoria)`);
  console.log(`Demais recrutadoras: daniele, cleise, beatriz, shelly @maisbarato.demo / ${SENHA_DEMO}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
