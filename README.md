# DUCK STUDIO OS — Pacote Unificado

Entrega compacta, visual e funcional para Duck.

## Conteúdo

- `source/` código-fonte completo do checkout.
- `evidence/` capturas renomeadas e organizadas.
- `docs/` estudo visual, canal de clientes e ferramentas.
- `duck-studio-manual.pdf` dossiê premium completo em PDF.
- `manual-assets/` imagens geradas por IA usadas no manual.
- `docs/AUDITORIA-3000-PONTOS.csv` matriz de cobertura com limites explícitos.

## O que entra

- dashboard operacional
- canal de clientes
- ferramentas reais de áudio
- assistant widget
- fluxo de revisão
- visão de projeto

## Arquivos-chave

- Canal de clientes: `source/src/components/studio/views/client-portal.tsx`
- Ferramentas: `source/src/components/studio/views/tools.tsx`
- Shell principal: `source/src/components/studio/studio-shell.tsx`
- Projeto aberto: `source/src/components/studio/views/project-detail.tsx`
- Manual PDF: `duck-studio-manual.pdf`

## Abertura

```powershell
bun install
bun run dev
```

## Observações

- `node_modules`, `.next` e `.git` não entram no pacote.
- As capturas de verificação estão em `evidence/`.
