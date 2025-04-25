import { Body, Composite, Engine, Vector } from "matter-js";
import { CreatePlayerBody } from "./Player";

export interface OptionalVector extends Vector {
    hasValue: boolean;
} 

export class ServerActor extends Phaser.GameObjects.Sprite {
    private _engine: Engine;
    public syncedPos: Phaser.Math.Vector2;
    constructor(
        scene: Phaser.Scene,
        engine: Engine,
        x: number,
        y: number,
        texture: string
    ) {
        super(scene, x, y, texture);
        this._engine = engine;
        this.syncedPos = new Phaser.Math.Vector2(x, y);
        scene.add.existing(this);
    }

    public update(dt: number): void {
        const newPos = (new Phaser.Math.Vector2(this.x, this.y)).lerp(this.syncedPos, 0.3);
        this.setPosition(newPos.x, newPos.y);
    }
}