import contextlib
import io
import json
import threading
import time
import unittest

from core.eventos import PREFIXO, emitir_evento, log


class FluxoLento(io.StringIO):

    """Força troca de threads a cada escrita, como acontece num pipe real."""

    def write(self, texto):
        resultado = super().write(texto)
        time.sleep(0.0005)
        return resultado


class TestEmitirEvento(unittest.TestCase):

    def test_formato_da_linha(self):

        saida = io.StringIO()

        with contextlib.redirect_stdout(saida):
            emitir_evento("progresso", {"atual": 1, "total": 3})

        linha = saida.getvalue().strip()

        self.assertTrue(linha.startswith(PREFIXO))

        evento = json.loads(linha[len(PREFIXO):])

        self.assertEqual(evento["tipo"], "progresso")
        self.assertEqual(evento["payload"], {"atual": 1, "total": 3})
        self.assertIn("timestamp", evento)

    def test_payload_padrao_e_dicionario_vazio(self):

        saida = io.StringIO()

        with contextlib.redirect_stdout(saida):
            emitir_evento("iniciado")

        evento = json.loads(saida.getvalue().strip()[len(PREFIXO):])

        self.assertEqual(evento["payload"], {})

    def test_acentos_preservados(self):

        saida = io.StringIO()

        with contextlib.redirect_stdout(saida):
            emitir_evento("erro_fatal", {"mensagem": "ação inválida"})

        self.assertIn("ação inválida", saida.getvalue())

    def test_linhas_nao_se_misturam_entre_threads(self):

        saida = FluxoLento()

        def emitir(n):
            for i in range(40):
                emitir_evento("progresso", {"thread": n, "i": i})
                log(f"log {n} {i}")

        with contextlib.redirect_stdout(saida):
            threads = [threading.Thread(target=emitir, args=(n,)) for n in range(4)]
            for t in threads:
                t.start()
            for t in threads:
                t.join()

        linhas = saida.getvalue().splitlines()
        eventos = [json.loads(l[len(PREFIXO):]) for l in linhas if l.startswith(PREFIXO)]
        logs = [l for l in linhas if l.startswith("log ")]

        self.assertEqual(len(eventos), 160)
        self.assertEqual(len(logs), 160)
        self.assertEqual(len(linhas), 320)

if __name__ == "__main__":
    unittest.main()
