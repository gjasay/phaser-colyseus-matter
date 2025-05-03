import { Scene } from "phaser";
import { NetworkManager } from "../util/network/NetworkManager.ts";
import { InputHandler } from "../util/network/InputHandler.ts";
import { Player } from "../schema/Player";
import { CollectionCallback } from "@colyseus/schema";
import { PlayerPrefab } from "../prefabs/Player";
import { GameGrid, Structures } from "../util/grid/GameGrid";
import { Bodies, Body, Composite, Engine } from "matter-js";
import physicsConfig from "../../../config/physics.config";
import { ServerActor } from "../prefabs/ServerActor";
import { Tile } from "../schema/Tile";
import { TilesetterMapLoader } from "../util/rendering/MapLoader";
import { LoadTilesetterMap } from "../util/files/Maps";
import { CreateTileBody } from "../util/physics/CreateBody";

const CORRECTION_STRENGTH = 0.2;
const negMod = (n: number, m: number) => ((n % m) + m) % m;

const BuildMode = "build";
const FightMode = "fight";
type TGameMode = typeof BuildMode | typeof FightMode;

export class Game extends Scene {
  public inputHandler: InputHandler;
  private _accumulator: number = 0;
  private _clientPlayer: PlayerPrefab;
  private _syncedActors: ServerActor[] = [];
  private _engine: Engine;
  private _grid: GameGrid;
  private _mapLoader: TilesetterMapLoader;
  private _mode: TGameMode = "build";
  private _selectedStructure: number = Structures.CoinGenerator;
  private _delKey?: Phaser.Input.Keyboard.Key;

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

    this._grid = new GameGrid(await LoadTilesetterMap(this, "mapData", "mainMap"));
    this.cameras.main.setBounds(0, 0, this._grid.width, this._grid.height + 128);

    this._mapLoader = new TilesetterMapLoader(this);
    this._mapLoader.load("mainMap", "mapData");

    this.scene.launch("UI");

    this._delKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.input.on("wheel", (e: WheelEvent) => {
      if (e.deltaY > 0) {
        this._selectedStructure = negMod(this._selectedStructure - 1, Object.keys(Structures).length);
      } else {
        this._selectedStructure = negMod(this._selectedStructure + 1, Object.keys(Structures).length);
      }
    });

    const tileDown = (e: Phaser.Input.Pointer) => {
      if (this._delKey?.isDown) {
        const [success, tile] = this._grid.tryRemoveStructure(
          Math.floor(e.worldX / 32),
          Math.floor(e.worldY / 32),
          this._clientPlayer.team
        );
        if (success) {
          const body = tile.properties?.body;
          if (body !== undefined) {
            Composite.remove(this._engine.world, body);
          }
          NetworkManager.instance.room.send("remove", { x: tile.x, y: tile.y });
        }
      } else if (e.isDown && this._mode === "build") {
        const [success, tile] = this._grid.tryPlaceStructure(
          this._selectedStructure,
          Math.floor(e.worldX / 32),
          Math.floor(e.worldY / 32),
          this._clientPlayer.team
        );
        if (success) {
          tile.properties = {
            ...tile.properties,
            body: Bodies.rectangle(tile.x * 32 + 16, tile.y * 32 + 16, 32, 32, {
              collisionFilter: {
                category: 0b0010,
                mask: 0b1111
              },
              isStatic: true
            })
          }
          Composite.add(this._engine.world, tile.properties.body);
          NetworkManager.instance.room.send("place", {
            x: Math.floor(e.worldX / 32),
            y: Math.floor(e.worldY / 32),
            type: this._selectedStructure,
          });
        }
      }
    };

    this.input.on("pointermove", tileDown);
    this.input.on("pointerdown", tileDown);

    this.inputHandler = new InputHandler(this, {
      left: ["A", Phaser.Input.Keyboard.KeyCodes.LEFT],
      right: ["D", Phaser.Input.Keyboard.KeyCodes.RIGHT],
      up: ["W", Phaser.Input.Keyboard.KeyCodes.UP],
      down: ["S", Phaser.Input.Keyboard.KeyCodes.DOWN],
      toggleMode: ["F"],
    });
    this.inputHandler.startListening();

    const players = NetworkManager.instance.state.players as CollectionCallback<
      string,
      Player
    >;

    const tiles = NetworkManager.instance.state.tiles as CollectionCallback<number, Tile>;
    tiles.onAdd((tile) => {
      const [added, newTile] = this._grid.tryPlaceStructure(
        tile.type,
        Math.floor(tile.x),
        Math.floor(tile.y),
        this._clientPlayer.team
      );
      if (added) {
        newTile.properties = {
          ...newTile.properties,
          body: CreateTileBody(tile.x, tile.y)
        }
        Composite.add(this._engine.world, newTile.properties.body);
      }
    });

    NetworkManager.instance.room.onMessage('removeTile', (tile: any) => {
      console.log('removed');
      const [success, oldTile] = this._grid.tryRemoveStructure(tile.x, tile.y);
      if (success) {
        Composite.remove(this._engine.world, oldTile.properties.body);
      } else {
        console.log('whaaaa');
      }
    })

    players.onAdd((player: Player, sessionId: string) => {
      console.log("Player added:", player);
      if (sessionId === NetworkManager.instance.room.sessionId) {
        this._clientPlayer = new PlayerPrefab(
          this,
          this._engine,
          player.x,
          player.y,
          "wizard",
          player.teamId
        );
        this.cameras.main.startFollow(this._clientPlayer);
        NetworkManager.instance.schema(player).bindTo(this._clientPlayer.serverState);
        NetworkManager.instance.schema(player).bindTo(this._clientPlayer.serverRef);
        NetworkManager.instance.schema(player).onChange(() => {
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
        NetworkManager.instance.schema(player).onChange(() => {
          const syncedPlayer =
            this._syncedActors[this._syncedActors.length - 1];
          syncedPlayer.syncedPos = new Phaser.Math.Vector2(player.x, player.y);
        });
      }
    });

  }

  update(time: number, dt: number) {
    this._accumulator += dt;
    for (const actor of this._syncedActors) {
      actor.update(dt);
    }
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
    Engine.update(this._engine, dt);
    this.inputHandler.sync();
  }

  setBuildMode() {
    this._mode = "build";
  }

  setFightMode() {
    this._mode = "fight";
  }

  setSelectedStructure(num: number) {
    this._selectedStructure = num;
  }
}
