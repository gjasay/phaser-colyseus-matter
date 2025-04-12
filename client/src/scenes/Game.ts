import { Scene } from "phaser";
import { NetworkManager as nm } from "../util/NetworkManager";
import { InputHandler } from "../util/InputHandler";
import { Player } from "../schema/Player";
import { CollectionCallback } from "@colyseus/schema";
import gameConfig from "../../../config/game.config";
import { Rectangle } from "../schema/Rectangle";

export class Game extends Scene {
  public inputHandler: InputHandler;
  private _accumulator: number = 0;
  private _clientPlayer: Phaser.GameObjects.Rectangle;
  private _syncedPlayers: Phaser.GameObjects.Rectangle[] = [];
  private _entities: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super("Game");
  }

  preload() {
    this.load.setPath("assets");

    this.load.image("background", "bg.png");
    this.load.image("logo", "logo.png");
  }

  async create() {
    nm.instance.initialize();
    await nm.instance.connectToRoom("find");

    this.inputHandler = new InputHandler(this, {
      left: ["A", Phaser.Input.Keyboard.KeyCodes.LEFT],
      right: ["D", Phaser.Input.Keyboard.KeyCodes.RIGHT],
      jump: [
        "W",
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ],
    });
    this.inputHandler.startListening();

    const players = nm.instance.state.players as CollectionCallback<string, Player>
    const entities = nm.instance.state.rects as CollectionCallback<number, Rectangle>

    entities.onAdd((entity) => {
      const rectangle = this.add.rectangle(entity.x, entity.y, entity.width, entity.height, 0xff0000);
      nm.instance.schema(entity).bindTo(rectangle);
      this._entities.push(rectangle)
    });

    players.onAdd((player: Player, sessionId: string) => {
      console.log("Player added:", player);
      if (sessionId === nm.instance.room.sessionId) {
        this._clientPlayer = this.add.rectangle(player.x, player.y, player.width, player.height, 0x0000ff);
        nm.instance.schema(player).bindTo(this._clientPlayer);
      } else {
        this._syncedPlayers.push(this.add.rectangle(player.x, player.y, player.width, player.height, 0x00ff00));
        nm.instance.schema(player).bindTo(this._syncedPlayers[this._syncedPlayers.length - 1]);
      }
    });

  }

  update(_time: number, dt: number) {
    this._accumulator += dt;
    while (this._accumulator >= gameConfig.fixedTimestep) {
      this._accumulator -= gameConfig.fixedTimestep;
      this.fixedUpdate(gameConfig.fixedTimestep);
    }
  }

  fixedUpdate(_dt: number) {
    if(!this.inputHandler?.payload) return;

    this.inputHandler.sync();
  }
}
