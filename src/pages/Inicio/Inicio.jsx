import "./Inicio.css";
import { useState } from "react";
import { Play, Square } from "lucide-react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { useTarefa } from "@/hooks/useTarefa";
import { STATUS } from "@/state/tarefaReducer";

const ROTULOS = {
    [STATUS.PARADO]: "Parado",
    [STATUS.INICIANDO]: "Iniciando",
    [STATUS.EXECUTANDO]: "Executando",
    [STATUS.PARANDO]: "Parando",
    [STATUS.CONCLUIDO]: "Concluído",
    [STATUS.CANCELADO]: "Cancelado",
    [STATUS.ERRO]: "Erro",
};

function Inicio() {

    const { estado, disponivel, emAndamento, iniciar, parar } = useTarefa();
    const [etapas, setEtapas] = useState("10");

    const percentual = estado.total ? Math.round((estado.atual / estado.total) * 100) : 0;

    if (!disponivel) {
        return (
            <main className="inicio">
                <Card>
                    <h1 className="inicio-titulo">Abra pelo Electron</h1>
                    <p className="inicio-texto">
                        A ponte <code>window.api</code> só existe dentro do app desktop.
                        Use <code>npm run desktop</code>.
                    </p>
                </Card>
            </main>
        );
    }

    return (
        <main className="inicio">

            <Card>
                <h1 className="inicio-titulo">Tarefa de exemplo</h1>
                <p className="inicio-texto">
                    O backend Python executa as etapas e envia o progresso por eventos.
                    O botão Parar pede um encerramento cooperativo.
                </p>

                <label className="inicio-campo">
                    <span>Número de etapas (1–1000)</span>
                    <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={etapas}
                        onChange={(e) => setEtapas(e.target.value)}
                        disabled={emAndamento}
                    />
                </label>

                <div className="inicio-acoes">
                    <Button
                        leftIcon={Play}
                        onClick={() => iniciar({ etapas: Number(etapas) })}
                        disabled={emAndamento}
                        loading={estado.status === STATUS.INICIANDO}
                    >
                        Iniciar
                    </Button>
                    <Button
                        variant="danger"
                        leftIcon={Square}
                        onClick={parar}
                        disabled={!emAndamento || estado.status === STATUS.PARANDO}
                    >
                        Parar
                    </Button>
                </div>
            </Card>

            <Surface className="inicio-status">
                <div className="inicio-linha">
                    <span>Status: <strong>{ROTULOS[estado.status]}</strong></span>
                    <span>{estado.atual}/{estado.total || "–"}</span>
                </div>
                <div
                    className="inicio-progresso"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentual}
                >
                    <div style={{ width: `${percentual}%` }} />
                </div>
                {estado.erro && <p className="inicio-erro">{estado.erro}</p>}
                <ol className="inicio-log" aria-label="Eventos">
                    {estado.log.map((linha, i) => <li key={i}>{linha}</li>)}
                </ol>
            </Surface>

        </main>
    );

}

export default Inicio;
