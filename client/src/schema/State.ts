// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.33
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { Player } from './Player'
import { Team } from './Team'
import { Rectangle } from './Rectangle'
import { Tile } from './Tile'

export class State extends Schema {
    @type({ map: Player }) public players: MapSchema<Player> = new MapSchema<Player>();
    @type(Team) public team1: Team = new Team();
    @type(Team) public team2: Team = new Team();
    @type([ Rectangle ]) public rects: ArraySchema<Rectangle> = new ArraySchema<Rectangle>();
    @type([ Tile ]) public tiles: ArraySchema<Tile> = new ArraySchema<Tile>();
}
