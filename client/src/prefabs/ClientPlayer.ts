import { PlayerPrefab } from "./Player";
import { Game } from "../scenes/Game";
import playerConfig from "../../../config/player.config";
import { syncPosition } from "../util/network/SyncPosition.ts"

export class ClientPlayer extends PlayerPrefab {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
  ) {
    super(scene, x, y, texture, frame);
  }

  public fixedUpdate(_dt: number) {
    const scene = this._scene as Game;
    const { up, down, left, right } = scene.inputHandler.payload;

    const walkSpeed = playerConfig.walkSpeed;

    // Apply movement based on local input (client-side prediction - mirroring server logic)
    let forceX = 0;
    let forceY = 0;

    if (left) {
      forceX -= walkSpeed;
    } else if (right) {
      forceX += walkSpeed;
    }

    if (up) {
      forceY -= walkSpeed;
    } else if (down) {
      forceY += walkSpeed;
    }

    this.applyForce({ x: forceX, y: forceY } as Phaser.Math.Vector2);

    scene.inputHandler.sync();

    if (!this.body) return;
    syncPosition(
      this.x,
      this.y,
      this.serverState,
      (x, y) => {
        this.setPosition(x, y);
      },
      (vx, vy) => {
        this.setVelocity(vx, vy);
      },
      this.body,
    )
  }
}
