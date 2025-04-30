import { NetworkManager } from "./NetworkManager.ts";
import * as Phaser from "phaser";

interface IInputPayload {
  [key: string]: boolean;
}

interface IInputActions {
  [key: string]: (Phaser.Input.Keyboard.Key | string | number)[];
}

export class InputHandler {
  private _input: IInputPayload;
  get payload() {
    if (!this._input) {
      this._input = {};
    }
    return this._input;
  }

  private _scene: Phaser.Scene;
  private _inputActionMap: Map<string, Phaser.Input.Keyboard.Key[]> = new Map<
    string,
    Phaser.Input.Keyboard.Key[]
  >();

  public constructor(scene: Phaser.Scene, inputActions: IInputActions) {
    this._scene = scene;

    Object.keys(inputActions).forEach((key) => {
      this._input = {
        ...this._input,
        [key]: false,
      };

      this.createInputAction(key, inputActions[key]);
    });

    console.log(this._input);
  }

  public startListening() {
    for (const [action, keys] of this._inputActionMap) {
      keys.map((key) =>
        key.on("down", () => {
          this.handleInput(action, true);
        }),
      );
      keys.map((key) =>
        key.on("up", () => {
          this.handleInput(action, false);
        }),
      );
    }
  }

  public sync() {
    NetworkManager.instance.room.send("input", this._input);
  }

  public stopListening() {
    for (const [_action, keys] of this._inputActionMap) {
      keys.map((key) => key.off("down"));
      keys.map((key) => key.off("up"));
    }
  }

  private handleInput(key: string, value: boolean): void {
    if (key in this._input) {
      this._input[key as keyof IInputPayload] = value;
    }
  }

  private createInputAction(
    action: string,
    keys: (Phaser.Input.Keyboard.Key | string | number)[],
  ) {
    const keyObjects = keys.map(
      (key) =>
        this._scene.input.keyboard?.addKey(key) as Phaser.Input.Keyboard.Key,
    );
    this._inputActionMap.set(action, keyObjects);
  }
}
