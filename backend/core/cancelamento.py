import sys
import time
import threading

from core.eventos import emitir_evento, log


# =====================================================
# ESTADO DE EXECUÇÃO (só um sinal
# de "pare assim que for seguro")
# =====================================================
#
# Estado de módulo, deliberadamente simples: um único processo
# Python roda uma tarefa por vez (main.py), então uma flag global
# é suficiente — não é uma máquina de estados, é só um sinal.

_cancelamento_solicitado = False


class CancelamentoSolicitado(Exception):
    """
    Levantada por verificar_cancelamento()/sleep_cancelavel() quando
    o usuário pediu para parar (Stop). NUNCA deve ser tratada como
    erro_fatal —
    é um encerramento cooperativo normal, não uma falha.
    """

    pass


def solicitar_cancelamento():
    """
    Idempotente: chamar mais de uma vez não tem efeito colateral
    extra (não reemite o evento, não "piora" nada) — o segundo Stop
    do usuário é seguro.
    """

    global _cancelamento_solicitado

    if _cancelamento_solicitado:
        return

    _cancelamento_solicitado = True

    emitir_evento("cancelamento_solicitado", {})


def cancelamento_foi_solicitado():

    return _cancelamento_solicitado


def verificar_cancelamento():

    """
    Ponto de checagem que interrompe o fluxo levantando
    CancelamentoSolicitado — pensado para os locais onde ainda não há
    nada aberto para limpar (ex.: entre as fases de main.py), onde
    deixar a exceção subir e encerrar tudo de uma vez é seguro.

    Em pontos onde JÁ existe algo aberto que precisa de cleanup
    específico (ex.: arquivos ou conexões abertos), prefira checar com
    cancelamento_foi_solicitado() e fazer a limpeza localmente.
    """

    if _cancelamento_solicitado:
        raise CancelamentoSolicitado()


def sleep_cancelavel(segundos, intervalo=0.15):

    """
    Substituto pontual de time.sleep() para esperas que realmente
    participam da tarefa principal e que podem ser longas — não é
    para trocar todo `time.sleep()` do projeto (a maioria já é curta
    o bastante para não atrapalhar a responsividade do Stop). Levanta
    CancelamentoSolicitado assim que percebe o pedido, em vez de
    dormir o tempo inteiro.
    """

    fim = time.time() + segundos

    while True:

        verificar_cancelamento()

        restante = fim - time.time()

        if restante <= 0:
            return

        time.sleep(min(intervalo, restante))


def resetar_cancelamento():

    """
    Só para o início de uma nova execução (main.py) e para testes —
    evita que um cancelamento de uma execução anterior vaze para a
    próxima (o estado é de módulo, então isso importa sobretudo em
    testes, que reimportam o mesmo processo Python várias vezes).
    """

    global _cancelamento_solicitado

    _cancelamento_solicitado = False


# =====================================================
# RECEBER "STOP" PELO STDIN (sinal do Electron)
# =====================================================
#
# Thread mínima e isolada: só lê linhas de texto e reage a "STOP" —
# nenhuma tarefa roda aqui. É a única thread além da principal que
# este backend cria.

COMANDO_PARAR = "STOP"


def _processar_comandos(linhas):

    for linha in linhas:

        comando = linha.strip().upper()

        if comando == COMANDO_PARAR:

            solicitar_cancelamento()


def escutar_stdin(fluxo=None):

    """
    Roda o laço de leitura em si (bloqueante) — existe separado de
    iniciar_escuta_stdin() para poder ser testado de forma síncrona,
    sem precisar de thread nem de stdin de verdade (basta passar
    qualquer iterável de linhas, ex.: io.StringIO("STOP\\n")).
    """

    fluxo = fluxo if fluxo is not None else sys.stdin

    try:

        _processar_comandos(fluxo)

    except Exception as erro:

        # stdin pode não estar disponível em algum cenário de
        # execução (ex.: variação de empacotamento) — isso não pode
        # derrubar a tarefa, que não depende dessa thread para
        # funcionar. O Stop ainda funciona via kill forçado do
        # Electron nesse caso (fallback já existente).
        log(f"[STDIN] escuta encerrada: {erro}")


def iniciar_escuta_stdin():

    """
    Dispara a escuta de stdin numa thread daemon (não bloqueia o
    fluxo principal da tarefa) e devolve a thread. `daemon=True`
    garante que ela não impede o processo de terminar.
    """

    thread = threading.Thread(
        target=escutar_stdin,
        daemon=True,
        name="app-escuta-stdin",
    )

    thread.start()

    return thread
