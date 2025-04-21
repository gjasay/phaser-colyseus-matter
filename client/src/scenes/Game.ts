import { Scene } from "phaser";
import { NetworkManager as nm } from "../util/NetworkManager";
import { InputHandler } from "../util/InputHandler";
import { Player } from "../schema/Player";
import { CollectionCallback } from "@colyseus/schema";
import { PlayerPrefab } from "../prefabs/Player";
import { Grid, TStructure } from "../util/rendering/Grid";
import { Bodies, Body, Composite, Engine } from "matter-js";
import physicsConfig from "../../../config/physics.config";
import { ServerActor } from "../prefabs/ServerActor";
import { Tile } from "../schema/Tile";
import { TilesetterMapLoader } from "../util/rendering/MapLoader";

const CORRECTION_STRENGTH = 0.2;

type TGameMode = "build" | "fight";

export class Game extends Scene {
  public inputHandler: InputHandler;
  private _accumulator: number = 0;
  private _clientPlayer: PlayerPrefab;
  private _syncedActors: ServerActor[] = [];
  private _engine: Engine;
  private _grid: Grid;
  private _mapLoader: TilesetterMapLoader;
  private _mode: TGameMode = "build";
  private _selectedStructure: TStructure = "coingen";

  get engine() {
    return this._engine;
  }

  constructor() {
    super("Game");
  }

  async create() {
    this._engine = Engine.create();
    this._engine.gravity = physicsConfig.gravity;
    this._engine.velocityIterations = physicsConfig.velocityIterations;
    this._engine.positionIterations = physicsConfig.positionIterations;
    this._engine.world.bounds = physicsConfig.worldBounds;

    this.cameras.main.setDeadzone(64, 64);

    this._engine.gravity = physicsConfig.gravity;
    this._engine.velocityIterations = physicsConfig.velocityIterations;
    this._engine.positionIterations = physicsConfig.positionIterations;
    this._engine.world.bounds = physicsConfig.worldBounds;
    this.cameras.main.zoomTo(2);

    this._grid = new Grid(this, 128, 128);

    this._mapLoader = new TilesetterMapLoader(this);
    this._mapLoader.load("mainMap", "mapData");

    this.scene.launch("UI");

    this.input.on("wheel", (e: WheelEvent) => {
      if (e.deltaY > 0) {
        // cycle throw structures
        if (this._selectedStructure === "coingen") {
          this._selectedStructure = "tower";
        } else if (this._selectedStructure === "tower") {
          this._selectedStructure = "wall";
        } else {
          this._selectedStructure = "coingen";
        }
      } else {
        // cycle throw structures
        if (this._selectedStructure === "coingen") {
          this._selectedStructure = "wall";
        } else if (this._selectedStructure === "tower") {
          this._selectedStructure = "coingen";
        } else {
          this._selectedStructure = "tower";
        }
      }
    });

    this.input.on("pointermove", (e: Phaser.Input.Pointer) => {
      if (e.middleButtonDown()) {
        this._grid.removeWall(
          Math.floor(e.worldX / 32),
          Math.floor(e.worldY / 32),
        );
      } else if (e.isDown && this._mode === "build") {
        if (
          this._grid.placeStructure(
            this._selectedStructure,
            Math.floor(e.worldX / 32),
            Math.floor(e.worldY / 32),
          )
        ) {
          console.log(
            "tiling",
            Math.floor(e.worldX / 32),
            Math.floor(e.worldY / 32),
          );
          nm.instance.room.send("place", {
            x: Math.floor(e.worldX / 32),
            y: Math.floor(e.worldY / 32),
            type: this._selectedStructure,
          });
        }
      }
    });
    nm.instance.initialize();
    await nm.instance.connectToRoom("find");

    this.inputHandler = new InputHandler(this, {
      left: ["A", Phaser.Input.Keyboard.KeyCodes.LEFT],
      right: ["D", Phaser.Input.Keyboard.KeyCodes.RIGHT],
      up: ["W", Phaser.Input.Keyboard.KeyCodes.UP],
      down: ["S", Phaser.Input.Keyboard.KeyCodes.DOWN],
      toggleMode: ["F"],
    });
    this.inputHandler.startListening();

    const players = nm.instance.state.players as CollectionCallback<
      string,
      Player
    >;

    const tiles = nm.instance.state.tiles as CollectionCallback<number, Tile>;
    tiles.onAdd((tile) => {
      switch (tile.type) {
        case "tower":
          this._grid.placeStructure(
            "tower",
            Math.floor(tile.x),
            Math.floor(tile.y),
          );
          break;
        case "coingen":
          this._grid.placeStructure(
            "coingen",
            Math.floor(tile.x),
            Math.floor(tile.y),
          );
          break;
        case "wall":
          this._grid.placeWall(Math.floor(tile.x), Math.floor(tile.y));
          break;
      }
      Composite.add(
        this._engine.world,
        Bodies.rectangle(tile.x * 32 + 16, tile.y * 32 + 16, 32, 32, {
          isStatic: true,
          collisionFilter: {
            category: 0b0010,
            mask: 0b1111,
          },
        }),
      );
    });

    players.onAdd((player: Player, sessionId: string) => {
      console.log("Player added:", player);
      if (sessionId === nm.instance.room.sessionId) {
        this._clientPlayer = new PlayerPrefab(
          this,
          this._engine,
          player.x,
          player.y,
          "wizard",
        );
        this.cameras.main.startFollow(this._clientPlayer);
        nm.instance.schema(player).bindTo(this._clientPlayer.serverState);
        nm.instance.schema(player).bindTo(this._clientPlayer.serverRef);
        nm.instance.schema(player).onChange(() => {
          const { x: nx, y: ny } = player;
          const { x: ox, y: oy } = this._clientPlayer;
          const dx = nx - ox;
          const dy = ny - oy;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 30) {
            Body.setPosition(this._clientPlayer.physBody, player);
          } else {
            const correction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(
              nx,
              ny,
            )
              .subtract(this._clientPlayer.physBody.position)
              .scale(CORRECTION_STRENGTH);
            Body.translate(this._clientPlayer.physBody, correction);
          }
        });
      } else {
        this._syncedActors.push(
          new ServerActor(this, this._engine, player.x, player.y, "wizard"),
        );
        nm.instance.schema(player).onChange(() => {
          const syncedPlayer =
            this._syncedActors[this._syncedActors.length - 1];
          syncedPlayer.syncedPos.hasValue = true;
          this.tweens.add({
            targets: syncedPlayer.syncedPos,
            x: player.x,
            y: player.y,
            duration: 100,
            ease: "Power1",
            onComplete: () => {
              this.tweens.add({
                targets: syncedPlayer.syncedPos,
                alpha: 1,
                duration: 500,
                ease: "Power1",
              });
            },
          });
        });
      }
    });
  }

  update(time: number, dt: number) {
    this._accumulator += dt;
    while (this._accumulator >= physicsConfig.fixedTimestep) {
      this._accumulator -= physicsConfig.fixedTimestep;
      this.fixedUpdate(time, physicsConfig.fixedTimestep);
    }
  }

  fixedUpdate(_time: number, dt: number) {
    if (!this.inputHandler?.payload || !this._clientPlayer) {
      return;
    }
    this._clientPlayer.fixedUpdate(dt);
    for (const actor of this._syncedActors) {
      actor.fixedUpdate(dt);
    }
    if (this.inputHandler.payload.toggleMode) {
      this._mode = this._mode === "build" ? "fight" : "build";
      this.inputHandler.payload.toggleMode = false;
    }
    Engine.update(this._engine, dt);
    this.inputHandler.sync();
  }
}
