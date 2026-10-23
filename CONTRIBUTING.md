# Como contribuir

Obrigado pelo interesse! Sugestões, correções e melhorias são bem-vindas.

## Antes de começar

- Para mudanças grandes, abra uma *issue* descrevendo a proposta antes do código.
- Procure manter o template genérico: nada de lógica específica de um produto.

## Ambiente

```bash
git clone https://github.com/4goSamuel/desktop-electron-react-python.git
cd desktop-electron-react-python
npm install
npm run desktop
```

Requisitos: Node.js 22+ e Python 3 no PATH (ou variável `PYTHON`).

## Fluxo

1. Faça um *fork* e crie uma branch a partir da `main` (ex.: `feat/configuracoes`, `fix/parada-dupla`).
2. Faça commits pequenos com mensagens descritivas (ex.: `fix: evita STOP duplicado`).
3. Antes de abrir o *pull request*, rode:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. No *pull request*, explique o que mudou, por quê e como testou.

## Padrões

- **Testes:** toda mudança de comportamento deve vir com teste.
  - Lógica do Electron sem dependência do Electron vai em `electron/backend.js`, testada em `tests/electron/`.
  - Estado da interface vai no reducer (`src/state/`), também testado em `tests/electron/`.
  - Backend Python: `backend/tests/` com `unittest`.
- **Segurança:** não exponha APIs do Node na interface; adicione funções específicas no `preload.cjs`.
- **Protocolo:** novos eventos devem seguir o formato `@@EVENT@@{json}` e ser documentados no README.
- **Estilo:** JavaScript segue o ESLint do projeto; Python segue a PEP 8.

## Reportando problemas

Inclua sistema operacional, versões do Node e do Python, passos para reproduzir e o log do terminal.
