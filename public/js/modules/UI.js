export const UI = {
  gameState: null,
  timerInterval: null,

  initialize(gameState) {
    this.gameState = gameState;
  },

  showMainMenu() {
    document.getElementById("menu-main").style.display = "flex";
    document.getElementById("menu-create").style.display = "none";
    document.getElementById("menu-join").style.display = "none";
    this.gameState.selectedCharacter = null;
    this.gameState.selectedMap = null;
    document
      .querySelectorAll(
        ".character-option, .character-option-join, .map-option"
      )
      .forEach((el) => el.classList.remove("selected"));
  },

  showCreateRoomMenu() {
    document.getElementById("menu-main").style.display = "none";
    document.getElementById("menu-create").style.display = "flex";
    document.getElementById("menu-join").style.display = "none";
  },

  showJoinRoomMenu() {
    document.getElementById("menu-main").style.display = "none";
    document.getElementById("menu-create").style.display = "none";
    document.getElementById("menu-join").style.display = "flex";
  },

  selectCharacter(character) {
    this.gameState.selectedCharacter = character;
    document
      .querySelectorAll(".character-option")
      .forEach((el) => el.classList.remove("selected"));
    document
      .querySelector(`.character-option[data-character="${character}"]`)
      .classList.add("selected");
  },

  selectJoinCharacter(character) {
    this.gameState.selectedCharacter = character;
    document
      .querySelectorAll(".character-option-join")
      .forEach((el) => el.classList.remove("selected"));
    document
      .querySelector(`.character-option-join[data-character="${character}"]`)
      .classList.add("selected");
  },

  selectMap(map) {
    this.gameState.selectedMap = map;
    document
      .querySelectorAll(".map-option")
      .forEach((el) => el.classList.remove("selected"));
    document
      .querySelector(`.map-option[data-map="${map}"]`)
      .classList.add("selected");
  },

  showWaitingRoom(roomId, map) {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-hud").style.display = "none";
    document.getElementById("end-screen").style.display = "none";
    document.getElementById("waiting-room").style.display = "flex";
    document.getElementById("room-id-display").textContent = roomId;
    document.getElementById("map-name-display").textContent =
      this.getDisplayName(map);
    document.getElementById("host-controls").style.display = this.gameState
      .isHost
      ? "flex"
      : "none";
  },

  updatePlayerList(players) {
    const playersList = document.getElementById("players-list");
    playersList.innerHTML = "";
    players.forEach((player) => {
      const playerItem = document.createElement("div");
      playerItem.className =
        "flex items-center justify-between p-2 bg-gray-600 rounded mb-2";
      const isCurrentPlayer = player.id === this.gameState.playerId;
      const isHost = player.id === players[0].id;
      playerItem.innerHTML = `
              <div class="flex items-center">
                  <img src="assets/sprites/${player.character}/Idle.png" alt="${
        player.character
      }" class="w-10 h-10 mr-2">
                  <span class="${
                    isCurrentPlayer ? "font-bold text-yellow-400" : ""
                  }">${isCurrentPlayer ? "Você" : "Jogador"}</span>
              </div>
              ${
                isHost
                  ? '<span class="bg-yellow-600 text-xs px-2 py-1 rounded">Host</span>'
                  : ""
              }
          `;
      playersList.appendChild(playerItem);
    });
  },

  hideWaitingRoom() {
    document.getElementById("waiting-room").style.display = "none";
  },

  showGameHUD() {
    document.getElementById("game-hud").style.display = "flex";
    this.initAttackCooldowns();
  },

  updateHealthBar(health, maxHealth = 100) {
    const healthBar = document.getElementById("player-health-bar");
    const healthText = document.getElementById("player-health-text");
    const percentage = Math.max(0, (health / maxHealth) * 100);
    healthBar.style.width = `${percentage}%`;
    healthBar.className = `h-full bg-gradient-to-r from-${
      percentage > 60 ? "green" : percentage > 30 ? "yellow" : "red"
    }-600 to-${
      percentage > 60 ? "green" : percentage > 30 ? "yellow" : "red"
    }-400`;
    healthText.textContent = `${health}/${maxHealth}`;
  },

  updateScore(score) {
    document.getElementById("player-score").textContent = score;
  },

  updateAttackCooldown(attackType, cooldown, maxCooldown) {
    const indicator = document.getElementById(`attack-cooldown-${attackType}`);
    const overlay = indicator.querySelector(".cooldown-overlay");
    if (cooldown <= 0) {
      indicator.classList.add("ready");
      indicator.classList.remove("cooldown");
      overlay.style.height = "0%";
    } else {
      indicator.classList.remove("ready");
      indicator.classList.add("cooldown");
      overlay.style.height = `${(cooldown / maxCooldown) * 100}%`;
    }
  },

  initAttackCooldowns() {
    this.maxCooldowns = { 1: 30, 2: 45, 3: 60 };
    for (let type = 1; type <= 3; type++)
      this.updateAttackCooldown(type, 0, this.maxCooldowns[type]);
  },

  startGameTimer(seconds, onComplete) {
    const timerDisplay = document.getElementById("timer-display");
    let remainingSeconds = seconds;
    if (this.timerInterval) clearInterval(this.timerInterval);
    timerDisplay.textContent = this.formatTime(remainingSeconds);
    this.timerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        timerDisplay.textContent = "00:00";
        if (onComplete) onComplete();
      } else {
        timerDisplay.textContent = this.formatTime(remainingSeconds);
        if (remainingSeconds <= 10)
          timerDisplay.classList.add("text-red-500", "pulse");
      }
    }, 1000);
  },

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  },

  showEndScreen(scores) {
    document.getElementById("waiting-room").style.display = "none";
    document.getElementById("game-hud").style.display = "none";
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-canvas").style.display = "none";
    const endScreen = document.getElementById("end-screen");
    endScreen.style.display = "flex";
    scores.sort((a, b) => b.score - a.score);
    const maxScore = scores.length > 0 ? scores[0].score : 0;
    const scoresContainer = document.getElementById("end-scores");
    scoresContainer.innerHTML = "";
    scores.forEach((score, index) => {
      const isCurrentPlayer = score.id === this.gameState.playerId;
      const isWinner = score.score === maxScore && score.score > 0;
      const scoreItem = document.createElement("div");
      scoreItem.className = `player-score-item ${isWinner ? "winner" : ""} ${
        isCurrentPlayer ? "current-player" : ""
      }`;
      scoreItem.innerHTML = `<span>${
        isCurrentPlayer ? "Você" : `Jogador ${index + 1}`
      }</span><span>${score.score} pontos</span>`;
      scoresContainer.appendChild(scoreItem);
    });
    const resultTitle = document.getElementById("result-title");
    const currentPlayerScore = scores.find(
      (s) => s.id === this.gameState.playerId
    );
    if (
      currentPlayerScore &&
      currentPlayerScore.score === maxScore &&
      maxScore > 0
    ) {
      resultTitle.textContent = "Vitória!";
      resultTitle.className = "text-3xl font-bold text-yellow-400 mb-6";
    } else {
      resultTitle.textContent = "Derrota!";
      resultTitle.className = "text-3xl font-bold text-red-500 mb-6";
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
  },

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },

  showLoadingMessage(message) {
    if (document.getElementById("loading-overlay")) return;
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loading-overlay";
    loadingOverlay.className =
      "absolute inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center";
    loadingOverlay.innerHTML = `<div class="bg-gray-800 p-8 rounded-lg text-center"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div><p class="text-white">${message}</p></div>`;
    document.body.appendChild(loadingOverlay);
  },

  hideLoadingMessage() {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) loadingOverlay.remove();
  },

  getDisplayName(value) {
    const displayNames = {
      Castle: "Castelo",
      Castle_Entry: "Entrada do Castelo",
      Dead_Forest: "Floresta Morta",
      Throne: "Sala do Trono",
      Samurai: "Samurai",
      Samurai_Archer: "Arqueiro Samurai",
      Samurai_Commander: "Comandante Samurai",
    };
    return displayNames[value] || value;
  },
};
