// Única ponte entre a interface (React) e o processo principal.
// Expõe só funções específicas — a interface não tem acesso ao Node.

const { contextBridge, ipcRenderer } = require("electron");

function escutar(canal, callback) {
    const listener = (_evento, dados) => callback(dados);
    ipcRenderer.on(canal, listener);
    return () => ipcRenderer.removeListener(canal, listener);
}

contextBridge.exposeInMainWorld("api", {

    iniciarTarefa: (opcoes) => ipcRenderer.invoke("tarefa-iniciar", opcoes),
    pararTarefa: () => ipcRenderer.invoke("tarefa-parar"),
    onEventoBackend: (callback) => escutar("backend-evento", callback),

    janelaMinimizar: () => ipcRenderer.invoke("janela-minimizar"),
    janelaMaximizarRestaurar: () => ipcRenderer.invoke("janela-maximizar-restaurar"),
    janelaFechar: () => ipcRenderer.invoke("janela-fechar"),
    janelaEstaMaximizada: () => ipcRenderer.invoke("janela-esta-maximizada"),
    onJanelaEstado: (callback) => escutar("janela-estado", callback),

});
