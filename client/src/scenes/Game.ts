import { Scene } from "phaser";
import { NetworkManager as nm } from "../util/NetworkManager";
import { InputHandler } from "../util/InputHandler";
import { Player } from "../schema/Player";
import { CollectionCallback } from "@colyseus/schema";
import gameConfig from "../../../config/game.config";
import playerConfig from "../../../config/player.config";
import { Rectangle } from "../schema/Rectangle";
import { PlayerPrefab } from "../prefabs/Player";
import physicsConfig from "../../../config/physics.config";

export class Game extends Scene {
  public inputHandler: InputHandler;
  private _accumulator: number = 0;
  private _clientPlayer: Phaser.GameObjects.Rectangle;
  private _clientPlayerBody: PlayerPrefab;
  private _syncedPlayers: Phaser.GameObjects.Rectangle[] = [];
  private _entities: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");

    this.load.image("background", "bg.png");
    this.load.image("logo", "logo.png");
    this.load.image("red", "red_cube.png");
    this.load.image("green", "green_cube.png");
  }

  async create() {
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
      this.matter.add.rectangle(
        entity.x,
        entity.y,
        entity.width,
        entity.height,
        { isStatic: true },
      ).gameObject = rectangle;
      nm.instance.schema(entity).bindTo(rectangle);
      this._entities.push(rectangle);
    });

    players.onAdd((player: Player, sessionId: string) => {
      console.log("Player added:", player);
      if (sessionId === nm.instance.room.sessionId) {
        this._clientPlayerBody = new PlayerPrefab(
          this,
          player.x,
          player.y,
          "green",
        );
        this._clientPlayerBody.createServerRef(
          player.x,
          player.y,
          player.width,
          player.height,
        );
        nm.instance.schema(player).bindTo(this._clientPlayerBody.serverState);
        nm.instance.schema(player).bindTo(this._clientPlayerBody.serverRef);
      } else {
        this._syncedPlayers.push(
          this.add.rectangle(
            player.x,
            player.y,
            player.width,
            player.height,
            0x00ff00,
          ),
        );
        nm.instance.schema(player).onChange(() => {
          const syncedPlayer =
            this._syncedPlayers[this._syncedPlayers.length - 1];
          this.tweens.add({
            targets: syncedPlayer,
            x: player.x,
            y: player.y,
            duration: 100,
            ease: "Power1",
            onComplete: () => {
              this.tweens.add({
                targets: syncedPlayer,
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
    while (this._accumulator >= gameConfig.fixedTimestep) {
      this._accumulator -= gameConfig.fixedTimestep;
      this.fixedUpdate(time, gameConfig.fixedTimestep);
    }
  }

  fixedUpdate(time: number, dt: number) {
    if (!this.inputHandler?.payload || !this._clientPlayerBody) return;
    this._clientPlayerBody.fixedUpdate(dt);
    this.matter.world.update(time, dt);
    this.inputHandler.sync();
  }
}
