import { AssetLoader } from "./AssetLoader.js";
import { SoundManager } from "./SoundManager.js";

export class Player {
  constructor(options) {
    this.id = options.id;
    this.character = options.character || "Samurai";
    this.isLocalPlayer = options.isLocalPlayer || false;
    this.position = options.position || { x: 100, y: 550 };
    this.velocity = { x: 0, y: 0 };
    this.direction = 1;
    this.state = "idle";
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.score = 0;
    this.isDead = false;
    this.isAttacking = false;
    this.attackCooldowns = { 1: 0, 2: 0, 3: 0 };
    this.attackType = 0;
    this.isJumping = false;
    this.isHurt = false;
    this.grounded = true;
    this.jumpForce = -16;
    this.gravity = 0.6;
    this.speed = 5;
    const stats = this.getCharacterStats(this.character);
    this.attackPower = stats.attack;
    this.defense = stats.defense;
    this.speed = stats.speed;
    this.maxHealth = stats.health;
    this.health = this.maxHealth;
    this.animations = {};
    this.animationSpeeds = this.getAnimationSpeeds();
    this.createSprite();
  }

  getCharacterStats(character) {
    const baseStats = {
      Samurai: { health: 100, attack: 10, defense: 5, speed: 5 },
      Samurai_Archer: { health: 80, attack: 15, defense: 3, speed: 6 },
      Samurai_Commander: { health: 120, attack: 8, defense: 8, speed: 4 },
    };
    return baseStats[character] || baseStats["Samurai"];
  }

  getAnimationSpeeds() {
    const baseSpeeds = {
      idle: 0.08,
      walk: 0.12,
      run: 0.15,
      jump: 0.12,
      attack: 0.18,
      hurt: 0.12,
      dead: 0.1,
      protection: 0.1,
    };
    if (this.character === "Samurai_Archer")
      return { ...baseSpeeds, idle: 0.06, attack: 0.15 };
    if (this.character === "Samurai_Commander")
      return { ...baseSpeeds, attack: 0.2 };
    return baseSpeeds;
  }

  createSprite() {
    this.container = new PIXI.Container();
    this.container.position.set(this.position.x, this.position.y);
    this.loadAnimations();
    this.sprite = new PIXI.AnimatedSprite(this.animations.idle);
    this.sprite.animationSpeed = this.animationSpeeds.idle;
    this.sprite.loop = true;
    this.sprite.play();
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(2, 2);
    this.attackBox = new PIXI.Graphics();
    this.attackBox.beginFill(0xff0000, 0.0);
    this.attackBox.drawRect(0, -90, 100, 90);
    this.attackBox.endFill();
    this.attackBox.position.set(40, 0);
    this.attackBox.visible = false;
    this.hitbox = new PIXI.Graphics();
    this.hitbox.beginFill(0x00ff00, 0.0);
    this.hitbox.drawRect(-40, -110, 80, 110);
    this.hitbox.endFill();
    this.container.addChild(this.sprite, this.attackBox, this.hitbox);
    this.createPlayerUI();
  }

  createPlayerUI() {
    const uiContainer = new PIXI.Container();
    uiContainer.position.set(0, -130);
    this.nameText = new PIXI.Text(this.isLocalPlayer ? "Você" : "Jogador", {
      fontFamily: "Arial",
      fontSize: 14,
      fill: this.isLocalPlayer ? 0xffd700 : 0xffffff,
      align: "center",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowDistance: 1,
    });
    this.nameText.anchor.set(0.5, 0);
    const healthBarBg = new PIXI.Graphics();
    healthBarBg.beginFill(0x000000, 0.7);
    healthBarBg.drawRect(-30, 20, 60, 8);
    healthBarBg.endFill();
    this.healthBar = new PIXI.Graphics();
    this.updateHealthBar();
    uiContainer.addChild(this.nameText, healthBarBg, this.healthBar);
    this.container.addChild(uiContainer);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    this.healthBar.clear();
    const healthPercent = (this.health / this.maxHealth) * 100;
    const healthColor =
      healthPercent > 60 ? 0x33cc33 : healthPercent > 30 ? 0xffcc00 : 0xff3300;
    const width = 60 * (this.health / this.maxHealth);
    this.healthBar.beginFill(healthColor);
    this.healthBar.drawRect(-30, 20, width, 8);
    this.healthBar.endFill();
  }

  loadAnimations() {
    this.animations = {
      idle: AssetLoader.getSpritesheet(`${this.character}_Idle`),
      walk: AssetLoader.getSpritesheet(`${this.character}_Walk`),
      run: AssetLoader.getSpritesheet(`${this.character}_Run`),
      jump: AssetLoader.getSpritesheet(`${this.character}_Jump`),
      attack: [
        AssetLoader.getSpritesheet(`${this.character}_Attack_1`),
        AssetLoader.getSpritesheet(`${this.character}_Attack_2`),
        AssetLoader.getSpritesheet(`${this.character}_Attack_3`),
      ],
      hurt: AssetLoader.getSpritesheet(`${this.character}_Hurt`),
      dead: AssetLoader.getSpritesheet(`${this.character}_Dead`),
      protection: AssetLoader.getSpritesheet(`${this.character}_Protection`),
    };
  }

  update(deltaTime, platforms, players, onAttackHit) {
    if (this.isDead) return;
    this.velocity.y += this.gravity;
    this.grounded = false;
    let lowestPlatformY = 550;

    for (const platform of platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
        if (platform.y < lowestPlatformY && this.velocity.y > 0) {
          lowestPlatformY = platform.y;
          this.position.y = platform.y - this.hitbox.height / 2;
        }
        this.velocity.y = 0;
      }
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.y > 550) {
      this.position.y = 550;
      this.grounded = true;
      this.velocity.y = 0;
    }
    this.position.x = Math.max(50, Math.min(1230, this.position.x));

    if (this.velocity.x !== 0) this.direction = this.velocity.x > 0 ? 1 : -1;
    if (!this.isAttacking && !this.isHurt) {
      if (!this.grounded) this.setState("jump");
      else if (Math.abs(this.velocity.x) > 0.1)
        this.setState(this.velocity.x > 3 ? "run" : "walk");
      else this.setState("idle");
    }

    for (let key in this.attackCooldowns) {
      if (this.attackCooldowns[key] > 0) this.attackCooldowns[key] -= deltaTime;
    }

    if (this.isAttacking && this.isLocalPlayer) {
      for (const player of players) {
        if (
          player.id !== this.id &&
          !player.isDead &&
          this.checkAttackCollision(player)
        ) {
          const damage =
            { 1: 10, 2: 15, 3: 20 }[this.attackType] * (this.attackPower / 10);
          onAttackHit(player.id, Math.round(damage));
          this.isAttacking = false;
        }
      }
    }

    this.container.position.set(this.position.x, this.position.y);
    this.sprite.scale.x = 2 * this.direction;
    this.attackBox.position.set(this.direction === 1 ? 30 : -110, 0);
  }

  setState(state, attackType = 0) {
    if (this.state === state && state !== "attack") return;
    this.state = state;
    this.sprite.stop();
    if (state === "attack")
      this.sprite.textures = this.animations.attack[attackType - 1];
    else this.sprite.textures = this.animations[state];
    this.sprite.animationSpeed = this.animationSpeeds[state] || 0.1;
    this.sprite.loop =
      state !== "attack" && state !== "hurt" && state !== "dead";
    this.sprite.play();

    if (state === "attack") {
      this.isAttacking = true;
      this.attackType = attackType;
      this.attackBox.visible = true;
      this.sprite.onComplete = () => {
        this.isAttacking = false;
        this.attackBox.visible = false;
        this.setState("idle");
      };
    } else if (state === "hurt") {
      this.isHurt = true;
      SoundManager.play("hit");
      this.sprite.onComplete = () => {
        this.isHurt = false;
        this.setState("idle");
      };
    } else if (state === "dead") {
      this.isDead = true;
      SoundManager.play("death");
      this.sprite.onComplete = () => this.sprite.stop();
    }
  }

  attack(type) {
    if (this.isDead || this.isAttacking || this.attackCooldowns[type] > 0)
      return false;
    this.isAttacking = true;
    this.attackType = type;
    this.setState("attack", type);
    this.attackCooldowns[type] = { 1: 30, 2: 45, 3: 60 }[type];
    SoundManager.play("attack");
    return true;
  }

  takeDamage(damage, attackerId) {
    if (this.isDead) return false;
    const finalDamage = Math.round(
      damage * Math.max(0.2, 1 - this.defense / 20)
    );
    this.health = Math.max(0, this.health - finalDamage);
    this.updateHealthBar();
    this.showDamageText(finalDamage);
    if (this.health === 0) {
      this.setState("dead");
      return true;
    }
    this.setState("hurt");
    return false;
  }

  showDamageText(damage) {
    const damageText = new PIXI.Text(`-${damage}`, {
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "bold",
      fill: 0xff0000,
      stroke: 0xffffff,
      strokeThickness: 4,
      align: "center",
    });

    damageText.anchor.set(0.5, 0.5);
    damageText.position.set(0, -50);
    this.container.addChild(damageText);

    let elapsed = 0;
    const animate = (delta) => {
      elapsed += delta;
      damageText.position.y -= 1;
      damageText.alpha = Math.max(0, 1 - elapsed / 60);

      if (elapsed >= 60) {
        PIXI.Ticker.shared.remove(animate);
        this.container.removeChild(damageText);
        damageText.destroy();
      }
    };

    PIXI.Ticker.shared.add(animate);
  }

  jump() {
    if (this.grounded && !this.isAttacking && !this.isHurt && !this.isDead) {
      this.velocity.y = this.jumpForce;
      this.grounded = false;
      SoundManager.play("jump");
    }
  }

  move(direction) {
    if (!this.isAttacking && !this.isDead) {
      this.direction = direction;
      this.velocity.x =
        direction *
        (window.game?.keys["ShiftLeft"] || window.game?.keys["ShiftRight"]
          ? this.speed * 1.5
          : this.speed);
      if (this.grounded) this.setState(this.velocity.x > 3 ? "run" : "walk");
    }
  }

  stopMovement() {
    this.velocity.x = 0;
    if (this.grounded && !this.isAttacking && !this.isHurt)
      this.setState("idle");
  }

  respawn(position) {
    this.position = position || { x: 100, y: 550 };
    this.velocity = { x: 0, y: 0 };
    this.health = this.maxHealth;
    this.isDead = false;
    this.isAttacking = false;
    this.isHurt = false;
    this.attackCooldowns = { 1: 0, 2: 0, 3: 0 };
    this.grounded = true;
    if (this.container) {
      this.container.visible = true;
      this.container.alpha = 1;
      this.container.position.set(this.position.x, this.position.y);
    }
    this.setState("idle");
    this.updateHealthBar();
  }

  checkPlatformCollision(platform) {
    const playerBottom = this.position.y + this.hitbox.height / 2;
    const playerLeft = this.position.x - this.hitbox.width / 2;
    const playerRight = this.position.x + this.hitbox.width / 2;
    const platformTop = platform.y;
    const platformBottom = platform.y + 10;
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;
    return (
      this.velocity.y >= 0 &&
      playerBottom >= platformTop &&
      playerBottom <= platformBottom &&
      playerRight >= platformLeft &&
      playerLeft <= platformRight
    );
  }

  checkAttackCollision(player) {
    const attackBox = {
      x: this.position.x + (this.direction === 1 ? 40 : -140),
      y: this.position.y - 90,
      width: 100,
      height: 90,
    };

    const playerHitbox = {
      x: player.position.x - 40,
      y: player.position.y - 110,
      width: 80,
      height: 110,
    };

    return (
      attackBox.x < playerHitbox.x + playerHitbox.width &&
      attackBox.x + attackBox.width > playerHitbox.x &&
      attackBox.y < playerHitbox.y + playerHitbox.height &&
      attackBox.y + attackBox.height > playerHitbox.y
    );
  }

  updateRemote(data) {
    if (data.respawned) {
      this.position = data.position || { x: 100, y: 550 };
      this.velocity = { x: 0, y: 0 };
      this.health = this.maxHealth;
      this.isDead = false;
      this.isAttacking = false;
      this.isHurt = false;
      this.attackCooldowns = { 1: 0, 2: 0, 3: 0 };
      this.grounded = true;
      if (this.container) {
        this.container.visible = true;
        this.container.alpha = 1;
        this.container.position.set(this.position.x, this.position.y);
      }
      this.setState("idle");
      this.updateHealthBar();
      return;
    }

    if (data.position) this.position = data.position;
    if (data.velocity) this.velocity = data.velocity;
    if (data.direction) this.direction = data.direction;
    if (data.health !== undefined) {
      const oldHealth = this.health;
      this.health = data.health;

      // Mostrar dano quando a saúde diminui
      if (oldHealth > this.health) {
        this.showDamageText(oldHealth - this.health);
      }

      this.updateHealthBar();
      if (this.health === 0 && !this.isDead) this.setState("dead");
      else if (this.health > 0 && this.isDead) this.setState("idle");
    }

    // Processar estados de animação
    if (data.state && data.state !== this.state) {
      if (data.state === "attack") {
        // Garantir que a caixa de ataque esteja na direção correta
        if (this.attackBox) {
          this.attackBox.position.set(this.direction === 1 ? 30 : -110, 0);
        }

        // Resetar cooldowns para permitir ataque imediato
        this.attackCooldowns = { 1: 0, 2: 0, 3: 0 };
        this.isAttacking = false;

        // Executar o ataque com o tipo correto
        this.attack(data.attackType || 1);
      } else {
        this.setState(data.state);
      }
    }

    // Atualizar posição do container
    this.container.position.set(this.position.x, this.position.y);
  }
}
