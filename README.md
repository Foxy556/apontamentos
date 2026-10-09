<div align="center">

# 📝 apontamentos

**Apontamentos e desvios de campo com sincronização para o Notion, autenticação 2FA e IA.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Notion](https://img.shields.io/badge/Notion-API-000000?logo=notion&logoColor=white)](https://developers.notion.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🇧🇷 Sobre

Sistema web para **registrar apontamentos de trabalho e desvios de campo** sem depender de
planilha: o time lança o que fez (e o que saiu do padrão) no dia, a aplicação organiza e
**espelha tudo no Notion**, deixando o histórico consultável e o painel administrativo com
visão geral das atividades.

Feito para times que já vivem no Notion mas não querem que o registro dependa de alguém
lembrar de atualizar a database — e que precisam de um fluxo de login com **2FA** para quem
está em campo.

---

## ✨ Funcionalidades

- **Registro de apontamentos** — status `Pendente` / `Em Andamento` / `Concluído` /
  `Cancelado`, com filtros e histórico por período.
- **Modo offline** — o registro é enfileirado no navegador e sincronizado quando a conexão
  volta (`ModalApontamentoOffline`).
- **Sincronização com Notion** — criação e atualização de páginas na database do time via
  Notion API, com popup de status da integração (`PopupNotion`).
- **Desvios e ocorrências** — módulo `/admin/desvios` com classificação automática de
  desvios de Wi-Fi/conectividade e geração de texto pronto para o Notion.
- **Assistente IA (Groq)** — `/api/groq` coleta dados por conversa e devolve JSON estruturado;
  `/api/notion-ai` é um assistente para gerenciar tarefas e apontamentos no Notion.
- **Áreas** — `/painel` para o time e `/admin` (atividades, daily tasks, desvios, Notion,
  offline).
- **Autenticação segura** — JWT (`jose`) com **2FA por TOTP** (`otplib`).
- **Smart monitor** — acompanhamento externo de status (`/api/smart-monitor`).
- **Interface** — Tailwind CSS 4 e animações com Framer Motion.

---

## 🏗️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Linguagem | JavaScript |
| Integrações | Notion API, Groq (LLM) |
| Auth | JWT (`jose`) + TOTP 2FA (`otplib`) |
| Qualidade | ESLint 9 |

```
src/
├── app/
│   ├── api/          # activities, apontamentos, auth, daily-tasks,
│   │                 # groq, notion, notion-ai, smart-monitor
│   ├── admin/        # área administrativa
│   └── painel/       # painel do usuário
├── components/       # Sidebar, ModalApontamentoOffline, PopupNotion, ui
└── lib/              # notion.js, ssl.js
data/                 # activities.json (estado local)
deploy.js             # script de publicação
```

---

## 🚀 Como rodar

```bash
git clone https://github.com/Foxy556/apontamentos.git
cd apontamentos
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

| Comando | Descrição |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | servidor de produção |
| `npm run lint` | ESLint |

### Variáveis de ambiente

Crie um `.env.local` na raiz (já coberto pelo `.gitignore`) com as variáveis usadas no código:

```bash
# Notion
NOTION_API_KEY=...
NOTION_DATABASE_ID=...
NOTION_HISTORICO_PAGE_ID=...

# IA
GROQ_API_KEY=...

# Autenticação
JWT_SECRET=...
OTP_SECRET=...
PUBLIC_USERS=...

# Smart monitor (opcional)
SMART_MONITOR_URL=...
SMART_MONITOR_USER=...
SMART_MONITOR_PASS=...
```

> ⚠️ Nunca commite `.env.local` — `.env*` já está no `.gitignore`. Nenhuma credencial foi
> encontrada commitada no repositório.

---

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE).

---

<div align="center">

**Veja também:** [FlightDesk](https://github.com/Foxy556/FlightDesk) ·
[net_troubleshoot](https://github.com/Foxy556/net_troubleshoot) ·
[Perfil](https://github.com/Foxy556)

</div>
