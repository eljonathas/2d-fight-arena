import { Player } from "./Player.js";
import { GameMap } from "./Map.js";
import { UI } from "./UI.js";
import { SoundManager } from "./SoundManager.js";

export class Game {
  constructor(options) {
    this.playerId = options.playerId;
    this.players = {};
    this.playerInfo = options.players || [];
    this.wsManager = options.wsManager;
    this.mapName = options.map || "Castle";
    this.onGameEnd = options.onGameEnd;
    this.isRunning = false;
    this.keys = {};
    this.lastSyncTime = 0;
    this.syncInterval = 40;
    this.movementSyncInterval = 25;
    window.game = this;
    this.initializePixi();
    this.initializeControls();
  }

  initializePixi() {
    const canvas = document.getElementById("game-canvas");
    this.app = new PIXI.Application({
      width: 1280,
      height: 720,
      backgroundColor: 0x000000,
      antialias: true,
      view: canvas,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);
  }

  resizeCanvas() {
    const container = this.app.view.parentElement;
    const ratio = 16 / 9;
    let width = container.clientWidth,
      height = container.clientHeight;
    if (width / height > ratio) width = height * ratio;
    else height = width / ratio;
    this.app.view.style.width = `${width}px`;
    this.app.view.style.height = `${height}px`;
  }

  initializeControls() {
    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
    this.addTouchControls();
  }

  addTouchControls() {
    if (
      !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    )
      return;
    const touchControls = document.createElement("div");
    touchControls.className =
      "fixed bottom-10 left-0 right-0 flex justify-between px-4";
    const dirButtons = `<div class="flex space-x-2">
            <button id="left-btn" class="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button id="right-btn" class="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>`;
    const actionButtons = `<div class="flex space-x-2">
            <button id="jump-btn" class="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </button>
            <button id="attack-btn" class="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>`;
    touchControls.innerHTML = dirButtons + actionButtons;
    document.body.appendChild(touchControls);
    document
      .getElementById("left-btn")
      .addEventListener("touchstart", () => (this.keys["ArrowLeft"] = true));
    document
      .getElementById("left-btn")
      .addEventListener("touchend", () => (this.keys["ArrowLeft"] = false));
    document
      .getElementById("right-btn")
      .addEventListener("touchstart", () => (this.keys["ArrowRight"] = true));
    document
      .getElementById("right-btn")
      .addEventListener("touchend", () => (this.keys["ArrowRight"] = false));
    document
      .getElementById("jump-btn")
      .addEventListener("touchstart", () => (this.keys["Space"] = true));
    document
      .getElementById("jump-btn")
      .addEventListener("touchend", () => (this.keys["Space"] = false));
    document
      .getElementById("attack-btn")
      .addEventListener("touchstart", () => this.handleAttack());
  }

  start() {
    if (this.isRunning) return;
    this.map = new GameMap({
      name: this.mapName,
      width: this.app.screen.width,
      height: this.app.screen.height,
    });
    this.gameContainer.addChild(this.map.container);
    this.initializePlayers();
    this.app.ticker.add(this.gameLoop.bind(this));
    SoundManager.playBGM();
    this.isRunning = true;
  }

  initializePlayers() {
    this.players = {};
    const startPositions = [
      { x: 200, y: 450 },
      { x: 400, y: 450 },
      { x: 600, y: 450 },
      { x: 800, y: 450 },
    ];
    this.playerInfo.forEach((player, index) => {
      const position = startPositions[index % startPositions.length];
      const isLocalPlayer = player.id === this.playerId;
      this.players[player.id] = new Player({
        id: player.id,
        character: player.character,
        isLocalPlayer,
        position,
      });
      if (isLocalPlayer) this.localPlayer = this.players[player.id];
      this.gameContainer.addChild(this.players[player.id].container);
    });
  }

  gameLoop(delta) {
    if (!this.isRunning) return;
    if (this.localPlayer) {
      this.handleInput();
      this.sendPlayerUpdate();
    }
    this.updatePlayers(delta);
    if (this.map && this.localPlayer) this.map.update(delta, this.localPlayer);
  }

  handleInput() {
    if (!this.localPlayer || this.localPlayer.isDead) return;
    const moveDirection =
      this.keys["ArrowLeft"] || this.keys["KeyA"]
        ? -1
        : this.keys["ArrowRight"] || this.keys["KeyD"]
        ? 1
        : 0;
    if (moveDirection !== 0) this.localPlayer.move(moveDirection);
    else this.localPlayer.stopMovement();
    if (this.keys["ArrowUp"] || this.keys["KeyW"] || this.keys["Space"]) {
      this.localPlayer.jump();
      this.keys["Space"] = false;
    }
    if (this.keys["KeyJ"]) this.handleAttack(1), (this.keys["KeyJ"] = false);
    else if (this.keys["KeyK"])
      this.handleAttack(2), (this.keys["KeyK"] = false);
    else if (this.keys["KeyL"])
      this.handleAttack(3), (this.keys["KeyL"] = false);
  }

  handleAttack(type = 1) {
    if (!this.localPlayer || this.localPlayer.isDead) return;
    if (this.localPlayer.attack(type)) {
      this.wsManager.sendMessage({
        type: "attack",
        attackType: type,
        position: this.localPlayer.position,
        direction: this.localPlayer.direction,
      });
    }
  }

  updatePlayers(delta) {
    const playerList = Object.values(this.players);
    const platforms = this.map ? this.map.getPlatforms() : [];
    Object.values(this.players).forEach((player) => {
      player.update(delta, platforms, playerList, (targetId, damage) => {
        this.wsManager.sendMessage({
          type: "hit",
          targetId,
          damage,
          attackerId: this.playerId,
        });
      });
    });
    if (this.localPlayer) {
      UI.updateHealthBar(this.localPlayer.health, this.localPlayer.maxHealth);
      UI.updateScore(this.localPlayer.score);
      this.updateCooldownIndicators();
    }
  }

  sendPlayerUpdate(force = false) {
    if (!this.localPlayer) return;
    const now = Date.now();
    const interval =
      this.localPlayer.state === "walk" ||
      this.localPlayer.state === "run" ||
      this.localPlayer.state === "jump" ||
      this.localPlayer.state === "attack" ||
      Math.abs(this.localPlayer.velocity.x) > 0.1 ||
      Math.abs(this.localPlayer.velocity.y) > 0.1
        ? this.movementSyncInterval
        : this.syncInterval;
    if (!force && now - this.lastSyncTime < interval) return;
    this.lastSyncTime = now;
    const updateData = {
      type: "updatePlayer",
      position: this.localPlayer.position,
      state: this.localPlayer.state,
      health: this.localPlayer.health,
      direction: this.localPlayer.direction,
      velocity: this.localPlayer.velocity,
      grounded: this.localPlayer.grounded,
    };
    if (this.localPlayer.state === "attack")
      updateData.attackType = this.localPlayer.attackType;
    this.wsManager.sendMessage(updateData);
  }

  updateRemotePlayer(data) {
    const player = this.players[data.id];
    if (player && !player.isLocalPlayer) player.updateRemote(data);
  }

  handleRemotePlayerAttack(data) {
    const player = this.players[data.id];
    if (player && !player.isLocalPlayer) {
      if (data.position) player.position = data.position;
      if (data.direction) player.direction = data.direction;
      player.attack(data.attackType || 1);
    }
  }

  handleHit(data) {
    if (!this.localPlayer) return;
    const wasDead = this.localPlayer.isDead;
    const dead = this.localPlayer.takeDamage(data.damage, data.attackerId);
    UI.updateHealthBar(this.localPlayer.health, this.localPlayer.maxHealth);
    if (dead && !wasDead) this.playerDefeated(data.attackerId);
  }

  playerDefeated(defeatedBy) {
    if (defeatedBy && this.players[defeatedBy])
      this.players[defeatedBy].score += 1;
  }

  handlePlayerUpdate(data) {
    const player = this.players[data.id];
    if (player) {
      player.updateRemote(data);
    }
  }

  handlePlayerDefeated(data) {
    if (
      this.players[data.defeatedBy] &&
      this.players[data.defeatedBy].isLocalPlayer
    )
      UI.updateScore(this.players[data.defeatedBy].score);
  }

  handleRespawn(data) {
    if (this.localPlayer) {
      this.localPlayer.respawn(data.position);
      UI.updateHealthBar(this.localPlayer.health, this.localPlayer.maxHealth);
      this.wsManager.sendMessage({
        type: "updatePlayer",
        position: this.localPlayer.position,
        state: "idle",
        health: this.localPlayer.health,
        direction: this.localPlayer.direction,
        velocity: { x: 0, y: 0 },
        grounded: true,
        respawned: true,
      });
    }
  }

  removePlayer(playerId) {
    if (this.players[playerId]) {
      this.gameContainer.removeChild(this.players[playerId].container);
      delete this.players[playerId];
    }
  }

  end() {
    this.isRunning = false;
    this.app.ticker.remove(this.gameLoop.bind(this));
    SoundManager.stopBGM();
  }

  updateCooldownIndicators() {
    if (!this.localPlayer) return;
    const maxCooldowns = { 1: 30, 2: 45, 3: 60 };
    for (let type = 1; type <= 3; type++) {
      const cooldown = this.localPlayer.attackCooldowns[type];
      UI.updateAttackCooldown(type, cooldown, maxCooldowns[type]);
    }
  }
}
