interface ButtonConfig {
  x: number;
  y: number;
  text: string;
  onClick: () => void;
}

export class Button extends Phaser.GameObjects.Container {
  x: number;
  y: number;
  px: number = 10;
  py: number = 5;
  text: string;
  onClick: () => void;

  button: Phaser.GameObjects.Rectangle;
  buttonText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, { x, y, text, onClick }: ButtonConfig) {
    super(scene);
    this.x = x;
    this.y = y;
    this.text = text;
    this.onClick = onClick;

    this.createText();
    this.createButton();
    this.add([this.button, this.buttonText]);
    this.scene.add.existing(this);

    this.button.on("pointerover", this.pointerover);
    this.button.on("pointerout", this.pointerout);
    this.button.on("pointerup", this._onClick);
  }

  createText() {
    this.buttonText = this.scene.add
      .text(0, 0, this.text, {
        fontFamily: "Roboto Mono",
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(0.5);
  }

  createButton() {
    const textBounds = this.buttonText.getBounds();
    const width = textBounds.width + 2 * this.px;
    const height = textBounds.height + 2 * this.py;

    this.button = this.scene.add
      .rectangle(0, 0, width, height, 0x0000ff)
      .setStrokeStyle(2, 0x339933)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  }

  pointerover = () => {
    this.button.setFillStyle(0x0000aa);
    this.scene.tweens.add({
      targets: this,
      scale: 1.1,
      duration: 150,
      ease: "Power2",
    });
  };

  pointerout = () => {
    this.button.setFillStyle(0x0000ff);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 150,
      ease: "Power2",
    });
  };

  _onClick = () => {
    this.onClick();
  };

  disable() {
    this.pointerout();
    this.button.setInteractive(false);
    this.setAlpha(0.2);
  }

  enable() {
    this.setAlpha(1);
    this.button.setInteractive({ useHandCursor: true });
  }
}
