import { createServer } from "http";
import { WebSocketServer } from "ws";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(join(__dirname, "public")));
const server = createServer(app);
const wss = new WebSocketServer({ server });
const players = new Map();
const rooms = new Map();

wss.on("connection", (ws) => {
  const playerId = generateId();
  console.log(`Novo jogador conectado: ${playerId}`);
  players.set(ws, {
    id: playerId,
    room: null,
    character: null,
    position: { x: 100, y: 550 },
    health: 100,
    score: 0,
    state: "idle",
    velocity: { x: 0, y: 0 },
    isDead: false,
  });
  ws.send(JSON.stringify({ type: "connect", id: playerId }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }
  });

  ws.on("close", () => {
    const player = players.get(ws);
    if (player && player.room) {
      const room = rooms.get(player.room);
      if (room) {
        room.players = room.players.filter((p) => p.id !== player.id);
        room.players.forEach((p) => {
          const playerWs = getPlayerWs(p.id);
          if (playerWs)
            playerWs.send(
              JSON.stringify({ type: "playerDisconnect", id: player.id })
            );
        });
        if (room.players.length === 0) rooms.delete(player.room);
      }
    }
    players.delete(ws);
    console.log(`Jogador desconectado: ${player?.id}`);
  });
});

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getPlayerWs(playerId) {
  for (const [ws, player] of players.entries()) {
    if (player.id === playerId) return ws;
  }
  return null;
}

function handleMessage(ws, data) {
  const player = players.get(ws);
  if (!player) return;

  switch (data.type) {
    case "createRoom":
      const roomId = generateId();
      rooms.set(roomId, {
        id: roomId,
        host: player.id,
        players: [{ id: player.id, character: data.character }],
        map: data.map,
        status: "waiting",
      });
      player.room = roomId;
      player.character = data.character;
      ws.send(JSON.stringify({ type: "roomCreated", roomId, map: data.map }));
      break;

    case "joinRoom":
      const room = rooms.get(data.roomId);
      if (!room || room.status !== "waiting") {
        ws.send(
          JSON.stringify({
            type: "error",
            message: room ? "Jogo já iniciado" : "Sala não encontrada",
          })
        );
        return;
      }
      player.room = data.roomId;
      player.character = data.character;
      room.players.push({ id: player.id, character: data.character });
      ws.send(
        JSON.stringify({
          type: "playerJoined",
          roomId: room.id,
          players: room.players,
          map: room.map,
        })
      );
      room.players.forEach((p) => {
        if (p.id !== player.id) {
          const playerWs = getPlayerWs(p.id);
          if (playerWs)
            playerWs.send(
              JSON.stringify({
                type: "playerJoined",
                roomId: room.id,
                players: room.players,
                map: room.map,
              })
            );
        }
      });
      break;

    case "startGame":
      const gameRoom = rooms.get(player.room);
      if (!gameRoom || gameRoom.host !== player.id) return;
      gameRoom.status = "playing";
      gameRoom.players.forEach((p) => {
        const playerWs = getPlayerWs(p.id);
        if (playerWs)
          playerWs.send(
            JSON.stringify({
              type: "gameStarted",
              roomId: gameRoom.id,
              players: gameRoom.players,
              map: gameRoom.map,
            })
          );
      });
      break;

    case "updatePlayer":
      if (!player.room) return;
      player.position = data.position;
      player.state = data.state;
      player.direction = data.direction;
      player.velocity = data.velocity;
      if (data.health !== undefined) player.health = data.health;
      const playerRoom = rooms.get(player.room);
      if (!playerRoom) return;
      playerRoom.players.forEach((p) => {
        if (p.id !== player.id) {
          const playerWs = getPlayerWs(p.id);
          if (playerWs)
            playerWs.send(
              JSON.stringify({
                type: "playerUpdate",
                id: player.id,
                position: player.position,
                state: player.state,
                health: player.health,
                direction: player.direction,
                velocity: player.velocity,
                attackType: data.attackType,
              })
            );
        }
      });
      break;

    case "attack":
      if (!player.room) return;
      const attackRoom = rooms.get(player.room);
      if (!attackRoom) return;
      attackRoom.players.forEach((p) => {
        if (p.id !== player.id) {
          const playerWs = getPlayerWs(p.id);
          if (playerWs)
            playerWs.send(
              JSON.stringify({
                type: "playerAttack",
                id: player.id,
                attackType: data.attackType,
                position: player.position,
                direction: data.direction,
              })
            );
        }
      });
      break;

    case "hit":
      if (!player.room) return;
      const targetWs = getPlayerWs(data.targetId);
      if (targetWs) {
        const targetPlayer = players.get(targetWs);
        if (targetPlayer) {
          targetPlayer.health = Math.max(0, targetPlayer.health - data.damage);
          if (targetPlayer.health === 0 && !targetPlayer.isDead) {
            targetPlayer.isDead = true;
            player.score += 1;
            const hitRoom = rooms.get(player.room);
            if (hitRoom) {
              hitRoom.players.forEach((p) => {
                const playerWs = getPlayerWs(p.id);
                if (playerWs)
                  playerWs.send(
                    JSON.stringify({
                      type: "playerDefeated",
                      id: data.targetId,
                      defeatedBy: data.attackerId || player.id,
                      scores: hitRoom.players.map((pl) => ({
                        id: pl.id,
                        score: players.get(getPlayerWs(pl.id))?.score || 0,
                      })),
                    })
                  );
              });
              setTimeout(() => {
                if (players.has(targetWs) && targetPlayer.isDead) {
                  targetPlayer.health = 100;
                  targetPlayer.position = {
                    x: 100 + Math.random() * 500,
                    y: 550,
                  };
                  targetPlayer.velocity = { x: 0, y: 0 };
                  targetPlayer.state = "idle";
                  targetPlayer.isDead = false;
                  // Enviar mensagem de respawn para o jogador que morreu
                  targetWs.send(
                    JSON.stringify({
                      type: "respawn",
                      position: targetPlayer.position,
                      health: targetPlayer.health,
                      state: "idle",
                    })
                  );
                  // Enviar atualização para todos os outros jogadores
                  hitRoom.players.forEach((p) => {
                    const otherPlayerWs = getPlayerWs(p.id);
                    if (otherPlayerWs && p.id !== targetPlayer.id) {
                      otherPlayerWs.send(
                        JSON.stringify({
                          type: "playerUpdate",
                          id: targetPlayer.id,
                          position: targetPlayer.position,
                          state: "idle",
                          health: targetPlayer.health,
                          direction: targetPlayer.direction || 1,
                          velocity: { x: 0, y: 0 },
                          respawned: true,
                        })
                      );
                    }
                  });
                }
              }, 3000);
            }
          }
          targetWs.send(
            JSON.stringify({
              type: "hit",
              damage: data.damage,
              health: targetPlayer.health,
              attackerId: data.attackerId || player.id,
            })
          );
        }
      }
      break;

    case "gameEnd":
      if (!player.room || rooms.get(player.room)?.host !== player.id) return;
      const endRoom = rooms.get(player.room);
      endRoom.players.forEach((p) => {
        const playerWs = getPlayerWs(p.id);
        if (playerWs)
          playerWs.send(
            JSON.stringify({
              type: "gameEnded",
              scores: endRoom.players.map((pl) => ({
                id: pl.id,
                score: players.get(getPlayerWs(pl.id))?.score || 0,
              })),
            })
          );
      });
      endRoom.status = "waiting";
      break;

    case "respawn":
      if (!player.room) return;
      const respawnRoom = rooms.get(player.room);
      if (!respawnRoom) return;
      player.position = { x: 100 + Math.floor(Math.random() * 1000), y: 550 };
      player.health = 100;
      player.velocity = { x: 0, y: 0 };
      player.state = "idle";
      player.isDead = false;
      const playerWs = getPlayerWs(player.id);
      if (playerWs)
        playerWs.send(
          JSON.stringify({
            type: "respawn",
            position: player.position,
            health: player.health,
            state: "idle",
          })
        );
      respawnRoom.players.forEach((p) => {
        if (p.id !== player.id) {
          const otherPlayerWs = getPlayerWs(p.id);
          if (otherPlayerWs)
            otherPlayerWs.send(
              JSON.stringify({
                type: "playerUpdate",
                id: player.id,
                position: player.position,
                state: "idle",
                health: player.health,
                direction: player.direction || 1,
                velocity: { x: 0, y: 0 },
                respawned: true,
              })
            );
        }
      });
      break;
  }
}

server.listen(port, () =>
  console.log(`Servidor rodando em http://localhost:${port}`)
);
