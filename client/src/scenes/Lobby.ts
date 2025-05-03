import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { NetworkManager } from "../util/network/NetworkManager";

export class Lobby extends Phaser.Scene {
  hostButton: Button;
  joinButton: Button;

  constructor() {
    super("Lobby");
    NetworkManager.instance.initialize();
  }

  create() {
    this.hostButton = new Button(this, {
      x: this.renderer.width / 2,
      y: this.renderer.height * 0.1,
      text: "Host Game",
      onClick: async () => {
        this.disableButtons();
        await NetworkManager.instance.connectToRoom("host");
        navigator.clipboard
          .writeText(NetworkManager.instance.room.roomId)
          .then(() => {
            alert("Game hosted! Room ID copied to clipboard.");
            this.scene.start("Game");
          });
      },
    });

    // WIP
    // new TextInput(
    //   this,
    //   this.renderer.width / 2 - 390,
    //   this.renderer.height * 0.1 + 80
    // );

    this.joinButton = new Button(this, {
      x: this.renderer.width / 2,
      y: this.renderer.height * 0.1 + 100,
      text: "Join Game",
      onClick: async () => {
        this.disableButtons();
        const roomId = prompt(
          "Enter Room ID to join: (leave blank to join random game)"
        );
        if (roomId === null) {
          this.enableButtons();
        } else if (roomId) {
          await NetworkManager.instance.connectToRoom("join", roomId);
          this.scene.start("Game");
        } else {
          await NetworkManager.instance.connectToRoom("find");
          this.scene.start("Game");
        }
      },
    });
  }

  disableButtons() {
    this.hostButton.disable();
    this.joinButton.disable();
  }

  enableButtons() {
    this.hostButton.enable();
    this.joinButton.enable();
  }
}
