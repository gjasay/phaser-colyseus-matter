// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.33
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { Entity } from './Entity'

export class Tile extends Entity {
    @type("number") public type!: number;
    @type("number") public teamId!: number;
    @type("number") public cost!: number;
    @type("number") public hp!: number;
}
