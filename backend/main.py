"""
Ponto de entrada do backend Python.

O Electron inicia este processo e conversa com ele por dois canais:

* stdout: cada linha que começa com "@@EVENT@@" é um evento JSON
  (ver core/eventos.py) repassado para a interface React;
  as demais linhas são apenas log.
* stdin: a linha "STOP" pede um encerramento cooperativo
  (ver core/cancelamento.py).

A tarefa de exemplo (`tarefa_exemplo`) só conta etapas com uma pausa
entre elas. Substitua-a pela lógica do seu projeto.
"""

import argparse
import sys

from core.eventos import emitir_evento, log
from core.cancelamento import (
    CancelamentoSolicitado,
    iniciar_escuta_stdin,
    resetar_cancelamento,
    sleep_cancelavel,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def tarefa_exemplo(etapas, intervalo):

    emitir_evento("iniciado", {"total": etapas})

    for atual in range(1, etapas + 1):

        # Pausa que pode ser interrompida a qualquer momento pelo STOP.
        sleep_cancelavel(intervalo)

        log(f"etapa {atual}/{etapas} concluída")

        emitir_evento("progresso", {"atual": atual, "total": etapas})

    emitir_evento("finalizado", {"motivo": "concluido"})


def ler_argumentos(argv=None):

    parser = argparse.ArgumentParser(description="Backend de exemplo")

    parser.add_argument("--etapas", type=int, default=10)
    parser.add_argument("--intervalo", type=float, default=0.5)

    args = parser.parse_args(argv)

    if not 1 <= args.etapas <= 1000:
        parser.error("--etapas deve estar entre 1 e 1000")

    if not 0 <= args.intervalo <= 60:
        parser.error("--intervalo deve estar entre 0 e 60 segundos")

    return args


def executar(argv=None):

    """
    Fronteira única de tratamento de erro do processo. Cancelamento
    cooperativo nunca é tratado como erro.
    """

    args = ler_argumentos(argv)

    resetar_cancelamento()
    iniciar_escuta_stdin()

    try:

        tarefa_exemplo(args.etapas, args.intervalo)

    except CancelamentoSolicitado:

        emitir_evento("finalizado", {"motivo": "cancelado"})

    except Exception as erro:

        emitir_evento("erro_fatal", {"mensagem": str(erro)})

        raise


if __name__ == "__main__":

    executar()
