import json
import sys
import threading
from datetime import datetime


PREFIXO = "@@EVENT@@"

# A thread que escuta o stdin também emite eventos. Sem a trava, duas
# threads escrevendo ao mesmo tempo podem misturar as linhas (o print
# grava o texto e a quebra de linha separadamente) e gerar JSON inválido.
_trava_saida = threading.Lock()


def _escrever_linha(texto):

    with _trava_saida:
        sys.stdout.write(texto + "\n")
        sys.stdout.flush()


def emitir_evento(tipo, payload=None):

    evento = {
        "tipo": tipo,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "payload": payload or {},
    }

    _escrever_linha(PREFIXO + json.dumps(evento, ensure_ascii=False))


def log(mensagem):

    """Linha de log comum (sem o prefixo), segura entre threads."""

    _escrever_linha(str(mensagem))
