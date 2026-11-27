// Importa unidades, setores, cargos (e os vínculos cargo_setor) do Supabase
// local para o Supabase remoto, sem sobrescrever o que já existe no remoto
// (match por "nome", que é unique nas três tabelas) e sem alterar ids já
// existentes no remoto (evita quebrar FKs de vagas/funcionarios/profile_unidades).
//
// Uso: node scripts/sync-unidades-setores-cargos.mjs

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

const REMOTE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REMOTE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOCAL_URL = "http://127.0.0.1:56321";
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!REMOTE_URL || !REMOTE_SERVICE_ROLE_KEY) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local)");
  process.exit(1);
}

const local = createClient(LOCAL_URL, LOCAL_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const remote = createClient(REMOTE_URL, REMOTE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function syncTabelaSimples(tabela, colunas) {
  const { data: locais, error: errLocal } = await local.from(tabela).select(colunas.join(","));
  if (errLocal) throw new Error(`[local] ${tabela}: ${errLocal.message}`);

  const { data: remotos, error: errRemoto } = await remote.from(tabela).select("id,nome");
  if (errRemoto) throw new Error(`[remoto] ${tabela}: ${errRemoto.message}`);

  const nomesRemotos = new Set(remotos.map((r) => r.nome));
  const novos = locais.filter((l) => !nomesRemotos.has(l.nome));

  if (novos.length > 0) {
    // Não reaproveita o id local: deixa o remoto gerar o próprio id,
    // só evitando duplicar por nome.
    const payload = novos.map(({ id, created_at, ...resto }) => resto);
    const { error: errInsert } = await remote.from(tabela).insert(payload);
    if (errInsert) throw new Error(`[remoto] insert ${tabela}: ${errInsert.message}`);
  }

  console.log(
    `${tabela}: ${locais.length} no local, ${remotos.length} já existiam no remoto, ${novos.length} inserido(s).`
  );

  const { data: remotosAtualizados, error: errFinal } = await remote.from(tabela).select("id,nome");
  if (errFinal) throw new Error(`[remoto] ${tabela} (pós-insert): ${errFinal.message}`);
  return new Map(remotosAtualizados.map((r) => [r.nome, r.id]));
}

async function syncCargoSetor(mapaCargos, mapaSetores) {
  const { data: vinculos, error } = await local
    .from("cargo_setor")
    .select("cargos(nome), setores(nome)");
  if (error) throw new Error(`[local] cargo_setor: ${error.message}`);

  const { data: existentes, error: errExist } = await remote.from("cargo_setor").select("cargo_id,setor_id");
  if (errExist) throw new Error(`[remoto] cargo_setor: ${errExist.message}`);
  const existentesSet = new Set(existentes.map((e) => `${e.cargo_id}:${e.setor_id}`));

  const payload = [];
  const semCorrespondencia = [];
  for (const v of vinculos) {
    const cargoId = mapaCargos.get(v.cargos?.nome);
    const setorId = mapaSetores.get(v.setores?.nome);
    if (!cargoId || !setorId) {
      semCorrespondencia.push(`${v.cargos?.nome} / ${v.setores?.nome}`);
      continue;
    }
    const chave = `${cargoId}:${setorId}`;
    if (existentesSet.has(chave)) continue;
    existentesSet.add(chave);
    payload.push({ cargo_id: cargoId, setor_id: setorId });
  }

  if (payload.length > 0) {
    const { error: errInsert } = await remote.from("cargo_setor").insert(payload);
    if (errInsert) throw new Error(`[remoto] insert cargo_setor: ${errInsert.message}`);
  }

  console.log(
    `cargo_setor: ${vinculos.length} no local, ${payload.length} inserido(s)${
      semCorrespondencia.length ? `, ${semCorrespondencia.length} sem correspondência (${semCorrespondencia.join("; ")})` : ""
    }.`
  );
}

async function main() {
  const mapaUnidades = await syncTabelaSimples("unidades", ["id", "nome", "codigo", "ativo", "created_at"]);
  const mapaSetores = await syncTabelaSimples("setores", ["id", "nome", "created_at"]);
  const mapaCargos = await syncTabelaSimples("cargos", ["id", "nome", "created_at"]);
  await syncCargoSetor(mapaCargos, mapaSetores);
  void mapaUnidades;
  console.log("Sincronização concluída.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
