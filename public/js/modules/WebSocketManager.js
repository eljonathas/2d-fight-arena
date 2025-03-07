/**
 * Gerenciador de conexão WebSocket para comunicação com o servidor
 */
export class WebSocketManager {
  /**
   * Cria uma nova instância do gerenciador de WebSocket
   * @param {string} url - URL do servidor WebSocket
   * @param {function} messageHandler - Função para tratar mensagens recebidas
   */
  constructor(url, messageHandler) {
    this.url = url;
    this.messageHandler = messageHandler;
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    this.connect();
  }

  /**
   * Conecta ao servidor WebSocket
   */
  connect() {
    this.socket = new WebSocket(this.url);

    // Manipulador de evento de abertura da conexão
    this.socket.addEventListener("open", () => {
      console.log("Conexão WebSocket estabelecida");
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Manipulador de evento de mensagens recebidas
    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandler(data);
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
      }
    });

    // Manipulador de evento de fechamento da conexão
    this.socket.addEventListener("close", () => {
      console.log("Conexão WebSocket fechada");
      this.isConnected = false;

      // Tentar reconectar
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(
          `Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );
        setTimeout(() => this.connect(), 2000);
      } else {
        console.error("Número máximo de tentativas de reconexão atingido");

        // Mostrar mensagem de erro na UI
        const errorElement = document.createElement("div");
        errorElement.className =
          "absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50";
        errorElement.innerHTML = `
                    <div class="bg-red-800 p-8 rounded-lg max-w-md text-center">
                        <h2 class="text-2xl font-bold text-white mb-4">Erro de Conexão</h2>
                        <p class="text-white mb-6">Não foi possível conectar ao servidor. Por favor, recarregue a página e tente novamente.</p>
                        <button onclick="window.location.reload()" class="bg-white text-red-800 font-bold py-2 px-6 rounded-lg">
                            Recarregar
                        </button>
                    </div>
                `;
        document.body.appendChild(errorElement);
      }
    });

    // Manipulador de evento de erro
    this.socket.addEventListener("error", (error) => {
      console.error("Erro na conexão WebSocket:", error);
    });
  }

  /**
   * Envia uma mensagem para o servidor
   * @param {object} data - Dados a serem enviados
   */
  sendMessage(data) {
    if (this.isConnected) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error("Tentativa de enviar mensagem sem conexão estabelecida");
    }
  }

  /**
   * Fecha a conexão WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
