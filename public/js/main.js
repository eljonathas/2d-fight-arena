// Importação dos módulos
import { UI } from "./modules/UI.js";
import { Game } from "./modules/Game.js";
import { WebSocketManager } from "./modules/WebSocketManager.js";
import { AssetLoader } from "./modules/AssetLoader.js";
import { SoundManager } from "./modules/SoundManager.js";

// Configurar o PIXI para evitar erros de extensão
if (PIXI) {
  // Implementar método setExtensionXhrType se não existir
  if (!PIXI.Assets.setExtensionXhrType && PIXI.Assets) {
    PIXI.Assets.setExtensionXhrType = function (extension, type) {
      console.log(`Configuração de tipo para extensão ${extension} ignorada.`);
    };
  }

  // Suprimir alguns erros comuns
  PIXI.utils.skipHello(); // Evita mensagem de hello no console
}

// Estado global do jogo
const gameState = {
  playerId: null,
  roomId: null,
  isHost: false,
  selectedCharacter: null,
  selectedMap: null,
  players: [],
  game: null,
  wsManager: null,
};

// Inicialização quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Mostrar mensagem de carregamento
    UI.initialize(gameState);
    UI.showLoadingMessage("Conectando ao servidor...");

    // Inicializar gerenciador de WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    gameState.wsManager = new WebSocketManager(wsUrl, handleServerMessages);

    // Aguardar conexão com o servidor
    await new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 10;

      const checkConnection = () => {
        attempts++;
        if (gameState.wsManager.isConnected) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(
            new Error("Falha ao conectar ao servidor após várias tentativas.")
          );
        } else {
          setTimeout(checkConnection, 500);
        }
      };
      checkConnection();
    }).catch((error) => {
      console.error("Erro de conexão:", error);
      UI.showNotification("Erro de conexão. Tente novamente mais tarde.");
    });

    // Configurar manipuladores de eventos da UI
    setupUIEventHandlers();

    // Pré-carregar recursos do jogo
    UI.showLoadingMessage("Carregando recursos...");
    await AssetLoader.loadAllAssets().catch((error) => {
      console.warn("Alguns recursos não puderam ser carregados:", error);
      // Continuar mesmo com erros, usando fallbacks
    });
    UI.hideLoadingMessage();

    // Inicializar gerenciador de som
    SoundManager.initialize();

    console.log("Jogo inicializado com sucesso!");
  } catch (error) {
    console.error("Erro durante inicialização:", error);
    UI.hideLoadingMessage();
    UI.showNotification(
      "Ocorreu um erro durante a inicialização do jogo. Tente novamente."
    );
  }
});

// Configura manipuladores de eventos da UI
function setupUIEventHandlers() {
  // Menu principal
  document.getElementById("create-room-btn").addEventListener("click", () => {
    UI.showCreateRoomMenu();
  });

  document.getElementById("join-room-btn").addEventListener("click", () => {
    UI.showJoinRoomMenu();
  });

  // Menu de criação de sala
  document.querySelectorAll(".character-option").forEach((option) => {
    option.addEventListener("click", () => {
      UI.selectCharacter(option.dataset.character);
    });
  });

  document.querySelectorAll(".map-option").forEach((option) => {
    option.addEventListener("click", () => {
      UI.selectMap(option.dataset.map);
    });
  });

  document
    .getElementById("create-confirm-btn")
    .addEventListener("click", () => {
      if (!gameState.selectedCharacter || !gameState.selectedMap) {
        UI.showNotification("Selecione um personagem e um mapa!");
        return;
      }

      gameState.wsManager.sendMessage({
        type: "createRoom",
        character: gameState.selectedCharacter,
        map: gameState.selectedMap,
      });
    });

  document.getElementById("create-back-btn").addEventListener("click", () => {
    UI.showMainMenu();
  });

  // Menu de entrada em sala
  document.querySelectorAll(".character-option-join").forEach((option) => {
    option.addEventListener("click", () => {
      UI.selectJoinCharacter(option.dataset.character);
    });
  });

  document.getElementById("join-confirm-btn").addEventListener("click", () => {
    const roomId = document.getElementById("room-code-input").value.trim();

    if (!roomId) {
      UI.showNotification("Digite o código da sala!");
      return;
    }

    if (!gameState.selectedCharacter) {
      UI.showNotification("Selecione um personagem!");
      return;
    }

    gameState.wsManager.sendMessage({
      type: "joinRoom",
      roomId,
      character: gameState.selectedCharacter,
    });
  });

  document.getElementById("join-back-btn").addEventListener("click", () => {
    UI.showMainMenu();
  });

  // Sala de espera
  document.getElementById("start-game-btn").addEventListener("click", () => {
    if (gameState.players.length < 2) {
      UI.showNotification("É necessário pelo menos 2 jogadores para iniciar!");
      return;
    }

    gameState.wsManager.sendMessage({
      type: "startGame",
    });
  });

  // Tela de fim de jogo
  document.getElementById("play-again-btn").addEventListener("click", () => {
    // Encerrar o jogo atual se estiver ativo
    if (gameState.game) {
      gameState.game.end();
      gameState.game = null;
    }

    // Esconder a tela de fim de jogo e mostrar a sala de espera
    UI.showWaitingRoom(gameState.roomId, gameState.selectedMap);

    // Informar ao servidor que queremos reiniciar
    gameState.wsManager.sendMessage({
      type: "gameEnd",
    });

    console.log("Voltando para a sala de espera...");
  });

  // Manipulador de teclas
  window.addEventListener("keydown", (e) => {
    if (gameState.game && gameState.game.isRunning) {
      gameState.game.handleKeyDown(e);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (gameState.game && gameState.game.isRunning) {
      gameState.game.handleKeyUp(e);
    }
  });
}

// Manipulador de mensagens do servidor
function handleServerMessages(data) {
  switch (data.type) {
    case "connect":
      gameState.playerId = data.id;
      break;

    case "roomCreated":
      gameState.roomId = data.roomId;
      gameState.isHost = true;
      UI.showWaitingRoom(data.roomId, data.map);
      break;

    case "playerJoined":
      gameState.players = data.players;

      // Se o jogador está entrando em uma sala (não é host), mostrar a sala de espera
      if (!gameState.isHost && data.roomId) {
        gameState.roomId = data.roomId;
        gameState.selectedMap = data.map;
        UI.showWaitingRoom(data.roomId, data.map);
      }

      UI.updatePlayerList(data.players);
      SoundManager.play("playerJoin");
      break;

    case "error":
      UI.showNotification(data.message);
      break;

    case "gameStarted":
      startGame(data);
      break;

    case "playerUpdate":
      if (gameState.game) {
        gameState.game.updateRemotePlayer(data);
      }
      break;

    case "playerAttack":
      if (gameState.game) {
        gameState.game.handleRemotePlayerAttack(data);
      }
      break;

    case "hit":
      if (gameState.game) {
        gameState.game.handleHit(data);
      }
      break;

    case "playerDefeated":
      if (gameState.game) {
        gameState.game.handlePlayerDefeated(data);
      }
      break;

    case "respawn":
      if (gameState.game) {
        gameState.game.handleRespawn(data);
      }
      break;

    case "playerDisconnect":
      if (gameState.game && gameState.game.isRunning) {
        gameState.game.removePlayer(data.id);
      }
      gameState.players = gameState.players.filter((p) => p.id !== data.id);
      UI.updatePlayerList(gameState.players);
      break;

    case "gameEnded":
      UI.showEndScreen(data.scores);
      if (gameState.game) {
        gameState.game.end();
      }
      break;
  }
}

// Iniciar o jogo
function startGame(data) {
  try {
    gameState.players = data.players;

    // Esconder sala de espera e mostrar o jogo
    UI.hideWaitingRoom();
    UI.showGameHUD();

    // Inicializar o jogo
    gameState.game = new Game({
      playerId: gameState.playerId,
      players: gameState.players,
      wsManager: gameState.wsManager,
      map: data.map,
      onGameEnd: (scores) => {
        UI.showEndScreen(scores);
      },
    });

    // Iniciar o jogo
    gameState.game.start();

    // Iniciar timer
    UI.startGameTimer(120, () => {
      if (gameState.isHost) {
        gameState.wsManager.sendMessage({
          type: "gameEnd",
        });
      }
    });

    // Reproduzir som de início de jogo
    SoundManager.play("gameStart");
  } catch (error) {
    console.error("Erro ao iniciar o jogo:", error);
    UI.showNotification("Erro ao iniciar o jogo. Tente novamente.");
  }
}
