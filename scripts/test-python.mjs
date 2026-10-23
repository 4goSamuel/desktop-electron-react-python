// Roda os testes do backend com o mesmo interpretador que o Electron usa.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolverComandoBackend } from "../electron/backend.js";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { comando, cwd } = resolverComandoBackend({ raizProjeto: raiz });

const resultado = spawnSync(
    comando,
    ["-m", "unittest", "discover", "-s", "tests", "-t", ".", "-v"],
    { cwd, stdio: "inherit" }
);

if (resultado.error) {
    console.error(`Não foi possível executar "${comando}": ${resultado.error.message}`);
    console.error("Instale o Python 3 ou defina a variável PYTHON.");
}

process.exit(resultado.status ?? 1);
