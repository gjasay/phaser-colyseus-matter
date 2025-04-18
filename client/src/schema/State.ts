// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.33
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { Player } from './Player'
import { Rectangle } from './Rectangle'
import { Tile } from './Tile'

export class State extends Schema {
    @type({ map: Player }) public players: MapSchema<Player> = new MapSchema<Player>();
    @type([ Rectangle ]) public rects: ArraySchema<Rectangle> = new ArraySchema<Rectangle>();
    @type("number") public score!: number;
    @type([ Tile ]) public tiles: ArraySchema<Tile> = new ArraySchema<Tile>();
}
