import "./TitleBar.css";

import { Minus, Square, Copy, X } from "lucide-react";

// Linha de topo do AppShell: marca + região arrastável + controles
// de janela. Não guarda estado próprio nem fala com o Electron —
// isso é responsabilidade de quem a usa (AppShell).
function TitleBar({
    titulo = "Meu App",
    maximizada,
    onMinimizar,
    onMaximizarRestaurar,
    onFechar,
}) {

    return (

        <div className="title-bar">

            <div
                className="title-bar-drag"
                onDoubleClick={onMaximizarRestaurar}
            >

                <span className="title-bar-nome">{titulo}</span>

            </div>

            <div className="title-bar-controles">

                <button
                    type="button"
                    className="title-bar-botao"
                    onClick={onMinimizar}
                    aria-label="Minimizar"
                >
                    <Minus size={15} />
                </button>

                <button
                    type="button"
                    className="title-bar-botao"
                    onClick={onMaximizarRestaurar}
                    aria-label={maximizada ? "Restaurar" : "Maximizar"}
                >
                    {
                        maximizada
                            ? <Copy size={13} />
                            : <Square size={12} />
                    }
                </button>

                <button
                    type="button"
                    className="title-bar-botao title-bar-botao-fechar"
                    onClick={onFechar}
                    aria-label="Fechar"
                >
                    <X size={15} />
                </button>

            </div>

        </div>

    );

}

export default TitleBar;
