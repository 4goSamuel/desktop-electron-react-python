"""
Testa o backend como o Electron o usa: um processo separado,
lendo eventos do stdout e enviando STOP pelo stdin.
"""

import json
import os
import subprocess
import sys
import unittest

from core.eventos import PREFIXO

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def eventos(texto):
    return [
        json.loads(linha[len(PREFIXO):])
        for linha in texto.splitlines()
        if linha.startswith(PREFIXO)
    ]


class TestProcessoBackend(unittest.TestCase):

    def iniciar(self, *args):
        return subprocess.Popen(
            [sys.executable, "main.py", *args],
            cwd=BACKEND,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
        )

    def test_execucao_completa(self):
        p = self.iniciar("--etapas", "3", "--intervalo", "0")
        saida, _ = p.communicate(timeout=20)
        tipos = [e["tipo"] for e in eventos(saida)]
        self.assertEqual(p.returncode, 0)
        self.assertEqual(
            tipos, ["iniciado", "progresso", "progresso", "progresso", "finalizado"]
        )
        self.assertEqual(eventos(saida)[-1]["payload"]["motivo"], "concluido")

    def test_stop_encerra_de_forma_cooperativa(self):
        p = self.iniciar("--etapas", "100", "--intervalo", "0.2")
        saida, _ = p.communicate(input="STOP\n", timeout=20)
        lista = eventos(saida)
        self.assertEqual(p.returncode, 0)
        self.assertIn("cancelamento_solicitado", [e["tipo"] for e in lista])
        self.assertEqual(lista[-1]["tipo"], "finalizado")
        self.assertEqual(lista[-1]["payload"]["motivo"], "cancelado")

    def test_argumento_invalido_falha(self):
        p = self.iniciar("--etapas", "0")
        _, erro = p.communicate(timeout=20)
        self.assertNotEqual(p.returncode, 0)
        self.assertIn("--etapas", erro)


if __name__ == "__main__":
    unittest.main()
