"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Upload } from "lucide-react";
import { previsualizarImportacao, confirmarImportacao } from "@/lib/actions/importar-vagas";
import { TEMPLATE_COLUNAS, TEMPLATE_LINHA_EXEMPLO, type LinhaValidada } from "@/lib/import/vagas";

type Opcao = { id: string; nome: string };

function baixarModelo() {
  const headers = TEMPLATE_COLUNAS.map((c) => c.titulo);
  const exemplo = TEMPLATE_COLUNAS.map((c) => TEMPLATE_LINHA_EXEMPLO[c.chave] ?? "");
  const planilha = XLSX.utils.aoa_to_sheet([headers, exemplo]);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Vagas");
  XLSX.writeFile(livro, "modelo-importacao-vagas.xlsx");
}

export function ImportarVagas({ unidades }: { unidades: Opcao[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unidadeId, setUnidadeId] = useState("");
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const [linhasBrutas, setLinhasBrutas] = useState<Record<string, unknown>[]>([]);
  const [resultado, setResultado] = useState<LinhaValidada[] | null>(null);
  const [validando, setValidando] = useState(false);
  const [importando, setImportando] = useState(false);

  const validas = useMemo(() => resultado?.filter((l) => l.dados !== null).length ?? 0, [resultado]);
  const invalidas = (resultado?.length ?? 0) - validas;

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivoNome(file.name);
    setResultado(null);

    const buffer = await file.arrayBuffer();
    const livro = XLSX.read(buffer, { cellDates: true });
    const planilha = livro.Sheets[livro.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(planilha, { defval: "" });

    const chavePorTitulo = new Map<string, string>(
      TEMPLATE_COLUNAS.map((c) => [c.titulo, c.chave])
    );
    const normalizadas = linhas.map((linha) => {
      const linhaNormalizada: Record<string, unknown> = {};
      for (const [titulo, valor] of Object.entries(linha)) {
        const chave = chavePorTitulo.get(titulo as string) ?? titulo;
        linhaNormalizada[chave] = valor;
      }
      return linhaNormalizada;
    });

    setLinhasBrutas(normalizadas);
  }

  async function handleValidar() {
    setValidando(true);
    try {
      const resultado = await previsualizarImportacao(linhasBrutas);
      setResultado(resultado);
    } finally {
      setValidando(false);
    }
  }

  async function handleConfirmar() {
    if (!unidadeId) {
      toast.error("Selecione a unidade antes de confirmar");
      return;
    }
    setImportando(true);
    const res = await confirmarImportacao(unidadeId, linhasBrutas);
    setImportando(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(
      `${res.inseridas} vaga${res.inseridas === 1 ? "" : "s"} importada${res.inseridas === 1 ? "" : "s"}${
        res.ignoradas > 0 ? `, ${res.ignoradas} ignorada${res.ignoradas === 1 ? "" : "s"}` : ""
      }`
    );
    setLinhasBrutas([]);
    setResultado(null);
    setArquivoNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label>Unidade</Label>
              <Select value={unidadeId} onValueChange={(v) => setUnidadeId(v ?? "")}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Selecione a unidade">
                    {(value: string | null) =>
                      unidades.find((u) => u.id === value)?.nome ?? "Selecione a unidade"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="button" variant="outline" onClick={baixarModelo}>
              <Download className="size-4" />
              Baixar modelo
            </Button>

            <div className="flex flex-col gap-2">
              <Label>Planilha (.xlsx)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleArquivo}
                className="text-sm file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
              />
            </div>

            {arquivoNome && linhasBrutas.length > 0 && (
              <Button type="button" onClick={handleValidar} disabled={validando}>
                {validando ? "Validando..." : `Validar ${linhasBrutas.length} linha(s)`}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Baixe o modelo, preencha uma linha por vaga e carregue o arquivo. Cargos, setores e
            gestores são identificados pelo nome — confira se eles já estão cadastrados antes de
            importar.
          </p>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge
                  variant="outline"
                  className="border bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500"
                >
                  {validas} válida{validas === 1 ? "" : "s"}
                </Badge>
                {invalidas > 0 && (
                  <Badge
                    variant="outline"
                    className="border bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500"
                  >
                    {invalidas} com erro
                  </Badge>
                )}
              </div>
              <Button type="button" onClick={handleConfirmar} disabled={importando || validas === 0}>
                <Upload className="size-4" />
                {importando ? "Importando..." : `Confirmar importação (${validas})`}
              </Button>
            </div>

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Linha</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Abertura</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.map((l) => (
                    <TableRow key={l.linha}>
                      <TableCell className="text-muted-foreground">{l.linha}</TableCell>
                      <TableCell>{String(l.original.cargo ?? "—")}</TableCell>
                      <TableCell>{String(l.original.motivo ?? "—")}</TableCell>
                      <TableCell>{String(l.original.data_abertura ?? "—")}</TableCell>
                      <TableCell>{String(l.original.situacao ?? "—")}</TableCell>
                      <TableCell>
                        {l.dados ? (
                          <Badge
                            variant="outline"
                            className="border bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500"
                          >
                            OK
                          </Badge>
                        ) : (
                          <span className="text-xs text-destructive">{l.erros.join("; ")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
