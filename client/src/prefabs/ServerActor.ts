import { Body, Composite, Engine, Vector } from "matter-js";
import { CreatePlayerBody } from "./Player";

export interface OptionalVector extends Vector {
    hasValue: boolean;
} 

export class ServerActor extends Phaser.GameObjects.Sprite {
    private _engine: Engine;
    public physBody: Body;

    public syncedPos: OptionalVector = {... Vector.create(0, 0), hasValue: false };
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
        if(this.syncedPos.hasValue) {
            console.log("Have synced pos")
            Body.setPosition(this.physBody, this.syncedPos);
            this.syncedPos.hasValue = false;
        }
        this.x = this.physBody.position.x;
        this.y = this.physBody.position.y;
    }
}