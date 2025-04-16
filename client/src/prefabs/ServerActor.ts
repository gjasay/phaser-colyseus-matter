import { Body, Composite, Engine } from "matter-js";
import { CreatePlayerBody } from "./Player";

export class ServerActor extends Phaser.GameObjects.Sprite {
    private _engine: Engine;
    public physBody: Body;
    constructor(
        scene: Phaser.Scene,
        engine: Engine,
        x: number,
        y: number,
        texture: string
    ) {
        super(scene, x, y, texture);
        this._engine = engine;
        this.physBody = CreatePlayerBody(x, y);
        Composite.add(this._engine.world, this.physBody);
        console.log('adding to world');
        scene.add.existing(this);
    }

    public fixedUpdate(dt: number): void {
        this.x = this.physBody.position.x;
        this.y = this.physBody.position.y;
    }
}