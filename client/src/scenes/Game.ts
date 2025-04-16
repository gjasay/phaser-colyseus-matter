import { Scene } from "phaser";
import { NetworkManager as nm } from "../util/NetworkManager";
import { InputHandler } from "../util/InputHandler";
import { Player } from "../schema/Player";
import { CollectionCallback } from "@colyseus/schema";
import gameConfig from "../../../config/game.config";
import { Rectangle } from "../schema/Rectangle";
import { PlayerPrefab } from "../prefabs/Player";
import { Grid } from "../util/rendering/Grid";
import { Bodies, Composite, Engine, Vector } from "matter-js";
import physicsConfig from "../../../config/physics.config";
import { ServerActor } from "../prefabs/ServerActor";

export class Game extends Scene {
  public inputHandler: InputHandler;
  private _accumulator: number = 0;
  private _clientPlayer: PlayerPrefab;
  private _syncedActors: ServerActor[] = [];
  private _entities: Phaser.GameObjects.Rectangle[] = [];
  private _engine: Engine;

  private _grid: Grid;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");

    this.load.image("background", "bg.png");
    this.load.image("logo", "logo.png");
    this.load.image("red", "red_cube.png");
    this.load.image("green", "green_cube.png");
    this.load.image("walls", "tiles/wall.png");
    this.load.image("wizard", "Ents/wizard.png");
  }

  async create() {
    this._engine = Engine.create();
    this._engine.gravity = physicsConfig.gravity;
    this._engine.velocityIterations = physicsConfig.velocityIterations;
    this._engine.positionIterations = physicsConfig.positionIterations;
    this._engine.world.bounds = physicsConfig.worldBounds;

    this._engine.gravity = physicsConfig.gravity;
    this._engine.velocityIterations = physicsConfig.velocityIterations;
    this._engine.positionIterations = physicsConfig.positionIterations;
    this._engine.world.bounds = physicsConfig.worldBounds;
    this.cameras.main.zoomTo(2);

    this._grid = new Grid(this, 1024, 768);

    this.input.on('pointermove', (e: Phaser.Input.Pointer) => {
      if(e.middleButtonDown()) {
        this._grid.removeWall(Math.floor(e.worldX / 32), Math.floor(e.worldY / 32));
      }
      else if(e.isDown) {
        this._grid.placeWall(Math.floor(e.worldX / 32), Math.floor(e.worldY / 32));
      }
    })
    nm.instance.initialize();
    await nm.instance.connectToRoom("find");

    this.inputHandler = new InputHandler(this, {
      left: ["A", Phaser.Input.Keyboard.KeyCodes.LEFT],
      right: ["D", Phaser.Input.Keyboard.KeyCodes.RIGHT],
      up: ["W", Phaser.Input.Keyboard.KeyCodes.UP],
      down: ["S", Phaser.Input.Keyboard.KeyCodes.DOWN],
    });
    this.inputHandler.startListening();

    const players = nm.instance.state.players as CollectionCallback<
      string,
      Player
    >;
    const entities = nm.instance.state.rects as CollectionCallback<
      number,
      Rectangle
    >;

    entities.onAdd((entity) => {
      const rectangle = this.add.rectangle(
        entity.x,
        entity.y,
        entity.width,
        entity.height,
        0xff0000,
      );
      //this._engine.C.add.rectangle(
      const floor = Bodies.rectangle(
        entity.x,
        entity.y,
        entity.width,
        entity.height,
        { isStatic: true },
      );
      Composite.add(this._engine.world, floor);
      nm.instance.schema(entity).bindTo(rectangle);
      this._entities.push(rectangle);
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
          this._clientPlayer.syncedPosition = {
            x: player.x,
            y: player.y
          };
          // this.tweens.add({
          //   targets: this._clientPlayer.physBody.position,
          //   x: player.x,
          //   y: player.y,
          //   duration: 100,
          //   ease: "Linear",
          //   onComplete: () => {
          //     this.tweens.add({
          //       targets: this._clientPlayer,
          //       alpha: 1,
          //       duration: 500,
          //       ease: "Linear"
          //     })
          //   }
          // })
        })
      } else {
        this._syncedActors.push(
          new ServerActor(
            this, this._engine,
            player.x, player.y,
            "wizard"
          )
        );
        nm.instance.schema(player).onChange(() => {

          const syncedPlayer =
            this._syncedActors[this._syncedActors.length - 1];
            syncedPlayer.physBody.position.x = player.x;
            syncedPlayer.physBody.position.y = player.y;
          // this.tweens.add({
          //   targets: syncedPlayer.physBody,
          //   x: player.x,
          //   y: player.y,
          //   duration: 100,
          //   ease: "Power1",
          //   onComplete: () => {
          //     this.tweens.add({
          //       targets: syncedPlayer,
          //       alpha: 1,
          //       duration: 500,
          //       ease: "Power1",
          //     });
          //   },
          // });
        });
      }
    });
  }

  update(time: number, dt: number) {
    this._accumulator += dt;
    while (this._accumulator >= gameConfig.fixedTimestep) {
      this._accumulator -= gameConfig.fixedTimestep;
      this.fixedUpdate(time, gameConfig.fixedTimestep);
    }
  }

  fixedUpdate(time: number, dt: number) {
    if (!this.inputHandler?.payload || !this._clientPlayer) {
      return;
    }
    this._clientPlayer.fixedUpdate(dt);
    for(const actor of this._syncedActors) {
      actor.fixedUpdate(dt);
    }
    Engine.update(this._engine, dt);
    this.inputHandler.sync();
  }
}
