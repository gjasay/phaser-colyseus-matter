export class Button extends Phaser.GameObjects.Group {
  constructor(scene: Phaser.Scene, x: number, y: number, text: string, callback: () => void) {
    super(scene);

    const button = scene.add.rectangle(x, y, 150, 50, 0x0000ff).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const buttonText = scene.add.text(x, y, text, { fontSize: "16px", color: "#fff" }).setOrigin(0.5);

    button.on("pointerup", () => {
      callback();
    });

    this.add(button);
    this.add(buttonText);
  }
}
