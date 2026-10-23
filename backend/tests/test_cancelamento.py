import contextlib
import io
import time
import unittest

from core import cancelamento as c


class TestCancelamento(unittest.TestCase):

    def setUp(self):
        c.resetar_cancelamento()

    def tearDown(self):
        c.resetar_cancelamento()

    def silencioso(self):
        return contextlib.redirect_stdout(io.StringIO())

    def test_sem_pedido_nao_interrompe(self):
        c.verificar_cancelamento()
        self.assertFalse(c.cancelamento_foi_solicitado())

    def test_stop_pelo_stdin_ativa_o_sinal(self):
        with self.silencioso():
            c.escutar_stdin(io.StringIO("ola\nstop\n"))
        self.assertTrue(c.cancelamento_foi_solicitado())
        with self.assertRaises(c.CancelamentoSolicitado):
            c.verificar_cancelamento()

    def test_outros_comandos_sao_ignorados(self):
        c.escutar_stdin(io.StringIO("PAUSE\n\n"))
        self.assertFalse(c.cancelamento_foi_solicitado())

    def test_pedido_e_idempotente(self):
        saida = io.StringIO()
        with contextlib.redirect_stdout(saida):
            c.solicitar_cancelamento()
            c.solicitar_cancelamento()
        self.assertEqual(saida.getvalue().count("cancelamento_solicitado"), 1)

    def test_sleep_cancelavel_interrompe_rapido(self):
        with self.silencioso():
            c.solicitar_cancelamento()
        inicio = time.monotonic()
        with self.assertRaises(c.CancelamentoSolicitado):
            c.sleep_cancelavel(5)
        self.assertLess(time.monotonic() - inicio, 1)

    def test_sleep_cancelavel_sem_pedido_espera_o_tempo(self):
        inicio = time.monotonic()
        c.sleep_cancelavel(0.2, intervalo=0.05)
        self.assertGreaterEqual(time.monotonic() - inicio, 0.19)


if __name__ == "__main__":
    unittest.main()
