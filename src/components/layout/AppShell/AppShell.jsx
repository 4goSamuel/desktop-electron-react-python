import "./AppShell.css";

import { useEffect, useState } from "react";

import TitleBar from "@/components/layout/TitleBar";

// Moldura única do app: define o tamanho real da janela (100vh/100vw,
// uma única vez) e dá o "enquadramento" visual do app — a barra de
// título faz parte dessa mesma moldura, sem linha separando do
// conteúdo. Cada página, dentro do app-shell-content, recebe 100% de
// altura/largura em vez de vh/vw própria.
function AppShell({ titulo, children }) {

    const [maximizada, setMaximizada] = useState(false);

    useEffect(() => {

        // Fora do Electron (ex.: `npm run dev` no navegador) não há window.api.
        if (!window.api) {
            return undefined;
        }

        let ativo = true;

        window.api
            .janelaEstaMaximizada()
            .then((resultado) => {

                if (ativo && resultado?.ok) {

                    setMaximizada(!!resultado.maximizada);

                }

            });

        const unsubscribe = window.api.onJanelaEstado((estado) => {

            setMaximizada(!!estado?.maximizada);

        });

        return () => {

            ativo = false;

            unsubscribe();

        };

    }, []);

    function minimizar() {

        window.api?.janelaMinimizar();

    }

    function maximizarRestaurar() {

        window.api?.janelaMaximizarRestaurar();

    }

    function fechar() {

        window.api?.janelaFechar();

    }

    const classe = maximizada
        ? "app-shell app-shell--maximizada"
        : "app-shell";

    return (

        <div className={classe}>

            <TitleBar
                titulo={titulo}
                maximizada={maximizada}
                onMinimizar={minimizar}
                onMaximizarRestaurar={maximizarRestaurar}
                onFechar={fechar}
            />

            <div className="app-shell-content">

                {children}

            </div>

        </div>

    );

}

export default AppShell;
