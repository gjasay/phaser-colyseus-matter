export class TextInput extends Phaser.GameObjects.Container {
  private box: Phaser.GameObjects.Graphics;
  private textObj: Phaser.GameObjects.Text;
  private cursorObj: Phaser.GameObjects.Text;
  private _text: string = "";
  private cursorVisible: boolean = true;
  private focused: boolean = false;
  private maxLength: number;
  private blinkEvent: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 300,
    height: number = 40,
    style: { fontSize?: string; color?: string; maxLength?: number } = {}
  ) {
    super(scene, x, y);

    this.width = width;
    this.height = height;
    this.maxLength = style.maxLength ?? 32;

    // Draw box
    this.box = scene.add.graphics();
    this.drawBox(0xeeeeee, 1.0);
    this.add(this.box);

    // Text object
    this.textObj = scene.add.text(10, 8, "", {
      fontFamily: "monospace",
      fontSize: style.fontSize || "22px",
      color: style.color || "#222",
    });
    this.add(this.textObj);

    // Cursor
    this.cursorObj = scene.add.text(10, 8, "|", {
      fontFamily: "monospace",
      fontSize: style.fontSize || "22px",
      color: style.color || "#222",
    });
    this.add(this.cursorObj);

    scene.add.existing(this);

    // Interactive area
    this.setInteractive({ hitArea: { width, height }, useHandCursor: true });

    // Focus by click
    this.on("pointerdown", () => this.focus());

    // Cursor blink event
    this.cursorVisible = true;
    this.blinkEvent = scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.updateText();
      },
    });

    // Lose focus on clicking outside
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      console.log("Pointer down at", this.getBounds(), pointer.x, pointer.y);
      if (!this.getBounds().contains(pointer.x, pointer.y)) {
        this.blur();
      }
    });

    // Listen for keyboard input globally
    scene.input.keyboard?.on("keydown", this.handleKey, this);

    this.updateText();
  }

  focus(): void {
    this.focused = true;
    this.drawBox(0xffffff, 1.0);
    this.updateText();
  }

  blur(): void {
    this.focused = false;
    this.drawBox(0xeeeeee, 1.0);
    this.updateText();
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.focused) return;

    if (event.key.length === 1 && this._text.length < this.maxLength) {
      this._text += event.key;
    } else if (event.key === "Backspace") {
      this._text = this._text.slice(0, -1);
    } else if (event.key === "Enter") {
      // Optional: Emit event, blur, or callback here
      this.blur();
    }
    this.updateText();
  }

  private updateText(): void {
    this.textObj.setText(this._text);
    const metrics = this.textObj.getBounds();
    this.cursorObj.setX(10 + metrics.width);
    this.cursorObj.setVisible(this.focused && this.cursorVisible);
  }

  private drawBox(color: number, alpha: number): void {
    this.box.clear();
    this.box.fillStyle(color, alpha);
    this.box.fillRoundedRect(0, 0, this.width, this.height, 10);
    this.box.lineStyle(2, 0x777777, 1.0);
    this.box.strokeRoundedRect(0, 0, this.width, this.height, 10);
  }

  get value(): string {
    return this._text;
  }

  set value(val: string) {
    this._text = val.slice(0, this.maxLength);
    this.updateText();
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
    this.blinkEvent.destroy();
    this.textObj.destroy();
    this.cursorObj.destroy();
    this.box.destroy();
  }
}
