import { Button } from "../components/Button";

export class Lobby extends Phaser.Scene {
  constructor() {
    super("Lobby");
  }

  create() {
    //this.scene.start("Game");
    //this.scene.launch("UI");
    this.add.group(
      new Button(this, 100, 100, "Start Game", () => {
        console.log("Start Game clicked");
      })
    );
  }
}
