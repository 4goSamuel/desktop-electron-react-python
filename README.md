# Desktop Template — Electron + React + Python

Template para aplicativos desktop em que a **interface é feita com React** e o **processamento roda em Python**, ligados pelo Electron.

O projeto resolve um problema comum ao juntar essas tecnologias: como iniciar um processo Python a partir da interface, acompanhar o progresso em tempo real e **pará-lo com segurança**, sem deixar processos órfãos.

> Status: versão inicial (0.1.0). A tarefa incluída é apenas um exemplo (conta etapas com uma pausa entre elas) para ser substituída pela lógica do seu projeto. Empacotamento em instalador ainda **não** está configurado.

## Funcionalidades

- Janela sem moldura nativa, com barra de título própria (minimizar, maximizar/restaurar, fechar).
- Backend Python iniciado sob demanda pelo Electron.
- Eventos de progresso do Python para a interface em tempo real (protocolo JSON por linha).
- Botão **Parar** com encerramento cooperativo: o Python termina a etapa atual e sai; se não responder em 8 s, o Electron força o encerramento.
- O backend é encerrado automaticamente ao fechar o app.
- Validação das opções tanto no Electron quanto no Python.
- Componentes de interface reutilizáveis (`Button`, `Card`, `Input`, `Surface`, `AppShell`, `TitleBar`) com variáveis CSS de tema.
- Testes automatizados em JavaScript (`node:test`) e Python (`unittest`).

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Desktop | Electron (processo principal + `preload` com `contextBridge`) |
| Interface | React 19, Vite, CSS com variáveis, ícones `lucide-react` |
| Backend | Python 3 (somente biblioteca padrão) |
| Qualidade | ESLint, `node:test`, `unittest` |

## Arquitetura

```
┌──────────────────────┐   IPC (contextBridge)   ┌──────────────────────┐   stdin / stdout   ┌──────────────────────┐
│  React (renderer)    │ ──────────────────────▶ │  Electron (main)     │ ─────────────────▶ │  Python (backend)    │
│  src/                │   tarefa-iniciar/parar  │  electron/main.js    │   "STOP\n"         │  backend/main.py     │
│                      │ ◀────────────────────── │                      │ ◀───────────────── │                      │
│  useTarefa + reducer │   "backend-evento"      │  electron/backend.js │  @@EVENT@@{json}   │  core/eventos.py     │
└──────────────────────┘                         └──────────────────────┘                    └──────────────────────┘
```

**Protocolo de eventos.** O Python imprime uma linha por evento:

```
@@EVENT@@{"tipo": "progresso", "timestamp": "2026-10-23T10:00:00", "payload": {"atual": 3, "total": 10}}
```

Linhas sem o prefixo são tratadas como log. Eventos emitidos: `iniciado`, `progresso`, `cancelamento_solicitado`, `finalizado` (`motivo`: `concluido` ou `cancelado`) e `erro_fatal`. O Electron acrescenta `processo_backend_encerrado` quando o processo termina.

**Cancelamento cooperativo.** Uma thread mínima no Python lê o stdin; ao receber `STOP`, apenas liga um sinal. A tarefa verifica esse sinal em pontos seguros (`verificar_cancelamento()` / `sleep_cancelavel()`), então nunca é interrompida no meio de uma operação.

**Decisões de projeto**

- A lógica de comunicação fica em `electron/backend.js`, sem depender do Electron, para ser testada com `node --test`.
- O estado da interface é um *reducer* puro (`src/state/tarefaReducer.js`), derivado só dos eventos — também testável sem React.
- A interface não tem acesso ao Node: o `preload` expõe apenas funções específicas (`contextIsolation`, `sandbox` ativos, `nodeIntegration` desligado).

### Estrutura de pastas

```
backend/
  main.py              # ponto de entrada e tarefa de exemplo
  core/eventos.py      # emissão de eventos JSON
  core/cancelamento.py # sinal de parada + escuta do stdin
  tests/               # unittest (inclui teste do processo real)
electron/
  main.js              # janela, IPC e ciclo de vida do backend
  preload.cjs          # API exposta à interface (window.api)
  backend.js           # funções puras: leitura de linhas, comando, validação
src/
  components/          # ui/ (Button, Card, Input, Surface) e layout/ (AppShell, TitleBar)
  hooks/useTarefa.js   # liga a interface ao backend
  state/               # reducer do estado da tarefa
  pages/Inicio/        # tela de exemplo
  styles/              # variáveis de tema, reset e estilos globais
tests/electron/        # testes node:test
scripts/test-python.mjs
```

## Requisitos

- Node.js 22 ou superior
- Python 3 disponível no PATH (`python` no Windows, `python3` no Linux/macOS)
  - Para usar outro interpretador (ex.: um `venv`), defina a variável `PYTHON`.

## Instalação

```bash
git clone https://github.com/4goSamuel/desktop-electron-react-python.git
cd desktop-electron-react-python
npm install
```

O backend de exemplo não tem dependências externas de Python.

## Execução

```bash
npm run desktop   # inicia o Vite e abre o Electron quando o servidor estiver pronto
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm run dev` | Só o servidor Vite (no navegador a tela avisa que é preciso abrir pelo Electron) |
| `npm run electron` | Só o Electron (requer o Vite já rodando) |
| `npm run build` | Gera a interface em `dist/` |
| `npm run lint` | ESLint |

Também é possível rodar o backend sozinho:

```bash
cd backend
python main.py --etapas 5 --intervalo 0.2
```

## Testes

```bash
npm test          # todos
npm run test:js   # node:test — leitura de eventos, comando do Python, validação, reducer
npm run test:py   # unittest — eventos, cancelamento e o processo real com STOP pelo stdin
```

## Como adaptar

1. Substitua `tarefa_exemplo` em `backend/main.py` pela sua lógica, emitindo eventos com `emitir_evento(...)` e usando `sleep_cancelavel` / `verificar_cancelamento` em pontos seguros.
2. Trate os novos eventos em `src/state/tarefaReducer.js`.
3. Se precisar de novas opções, valide-as em `electron/backend.js` (`validarOpcoes`) e em `backend/main.py` (`ler_argumentos`).
4. Ajuste o título em `src/App.jsx` e as cores em `src/styles/variables/colors.css`.

## Limitações conhecidas

- **Empacotamento não configurado.** Em um app empacotado, o backend Python precisaria ser distribuído junto (ex.: um executável gerado com PyInstaller) e `resolverComandoBackend` ajustado.
- Uma tarefa por vez.
- Sem Content-Security-Policy configurada; recomendada antes de carregar conteúdo externo.

## Contribuição

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Créditos

Desenvolvido por **Rodrigo Samuel Gonzalez Oliveira** ([@4goSamuel](https://github.com/4goSamuel)).
Os componentes de interface e o mecanismo de eventos/cancelamento foram extraídos e generalizados de um projeto desktop anterior do autor.

## Licença

Este projeto está licenciado sob a licença MIT.
Consulte o arquivo [LICENSE](LICENSE).
