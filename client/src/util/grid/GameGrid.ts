import { Engine } from "matter-js";
import { Scene } from "phaser";

export const Structures = {
    CoinGenerator: 0,
    Tower: 1,
    Wall: 2
} as const;

type Tile = {
    neighborhood: number,
    cardinality: number,
    trueCardinality: number
};

const CardinalityMap: Record<number, number> = {
    56: 0,
    62: 1,
    14: 2,
    8: 3,
    248: 4,
    255: 5,
    143: 6,
    136: 7,
    224: 8,
    227: 9,
    131: 10,
    128: 11,
    32: 12,
    34: 13,
    2: 14,
    0: 15,
    40: 16,
    46: 17,
    58: 18,
    10: 19,
    42: 20,
    232: 21,
    239: 22,
    251: 23,
    139: 24,
    235: 25,
    184: 26,
    191: 27,
    254: 28,
    142: 29,
    190: 30,
    160: 31,
    163: 32,
    226: 33,
    130: 34,
    162: 35,
    168: 36,
    175: 37,
    250: 38,
    138: 39,
    170: 40,
    187: 41,
    238: 42,
    186: 43,
    174: 44,
    234: 45,
    171: 46
} as const;

export class GameGrid {
    private _obstacles: Phaser.Tilemaps.TilemapLayer;
    private _walls: Phaser.Tilemaps.TilemapLayer;
    private _structures: Phaser.Tilemaps.TilemapLayer

    constructor(
        private _tilemap: Phaser.Tilemaps.Tilemap
    ) {
        const obstacles = this._tilemap.getLayer("Obstacle")?.tilemapLayer;
        if(obstacles === undefined) {
            throw new Error('Failed to load obstacles!');
        }
        this._obstacles = obstacles;

        const wallTileset = this._tilemap.addTilesetImage("walls");
        if(wallTileset === null) {
            throw new Error("Failed to load walls tileset");
        }
        const walls = this._tilemap.createBlankLayer("GameGrid_walls", wallTileset);
        if(walls === null) {
            throw new Error("Failed to load walls layer!");
        }
        this._walls = walls;

        const structuresTileset = this._tilemap.addTilesetImage("structures");
        if (structuresTileset === null) {
            throw new Error("Failed to load structures tileset");
        }
        const structures = this._tilemap.createBlankLayer("GameGrid_structures", structuresTileset);
        if (structures === null) {
            throw new Error("Failed to load structures tileset");
        }
        this._structures = structures;
    }

    private canBuild(x: number, y: number): boolean {
        return !(
            x >= this._tilemap.width || x < 0 ||
            y > this._tilemap.height || y < 0 ||
            this._structures.hasTileAt(x, y) ||
            this._walls.hasTileAt(x, y) ||
            this._obstacles.hasTileAt(x, y)
        );
    }

    tryPlaceStructure(type: number, x: number, y: number, team: number): [true, Phaser.Tilemaps.Tile] | [false, undefined] {
        if (!this.canBuild(x, y)) {
            return [false, undefined];
        }
        switch (type) {
            case Structures.CoinGenerator:
            case Structures.Tower:
                const tile = this._structures.putTileAt(type, x, y);
                tile.properties = { team };
                return [true, tile];
            case Structures.Wall:
                return [true, this.putWall(x, y, team)];
        }
        return [false, undefined];
    }

    public tryRemoveStructure(x: number, y: number, team?: number) : [false, undefined] | [true, Phaser.Tilemaps.Tile] {
        if (this.canBuild(x, y)) {
            return [false, undefined];
        }

        const structure = this._structures.getTileAt(x, y);
        if (structure !== null) {
            if (team !== undefined && structure.properties?.team !== team) {
                return [false, undefined];
            }
            this._structures.removeTileAt(x, y);
            return [true, structure];
        }

        const wall = this._walls.getTileAt(x, y);
        if (wall !== null) {
            if (team !== undefined && wall.properties?.team !== team) {
                return [false, undefined];
            }
            this._walls.removeTileAt(x, y);
            this._redrawTile(this._walls, x, y);
            return [true, wall];
        }
        return [false, undefined];
    }

    private putWall(x: number, y: number, team: number): Phaser.Tilemaps.Tile {
        const tile = this._walls.putTileAt(0, x, y);
        tile.properties = {
            ...tile.properties,
            team
        }
        this._redrawTile(this._walls, x, y);
        return this._walls.getTileAt(x, y);
    }

    private _redrawTile(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
        this.forEachNeighbor(layer, x, y, (layer, _x, _y) => {
            this._calculateCellNeighbor(layer, _x, _y),
            this._drawTile(layer, _x, _y);
        });
        this._drawTile(layer, x, y);
    }
    private _drawTile(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
        const tile = layer.getTileAt(x, y);
        if(tile !== null) {
            const cardinality = tile.properties.cardinality;
            const newTile = layer.putTileAt(CardinalityMap[cardinality], x, y);
            newTile.properties = tile.properties;
        }
    }

    private forEachNeighbor(
        layer: Phaser.Tilemaps.TilemapLayer,
        x: number,
        y: number,
        callback: (layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) => void
    ) {
        for(let i = -1; i <= 1; i++) {
            for(let j = -1; j <= 1; j++) {
                callback(layer, x + i, y + j);
            }
        }
    }

    private _calculateCellNeighbor(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
        const tile = layer.getTileAt(x, y, true);
        if (tile === null) {
            return;
        }
        const properties = tile.properties as Tile;
        properties.neighborhood = this._calculateImmediateNeighborhood(layer, x, y);
        properties.trueCardinality = this._calculateCardinality(layer, x, y);
        properties.cardinality = this._convertCardinalityToTilespace(properties.trueCardinality);
    }

    private _calculateImmediateNeighborhood(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
        let total = 0;
        if(layer.hasTileAt(x, y - 1)) {
            total++;
        }
        if(layer.hasTileAt(x - 1, y)) {
            total++;
        }
        if(layer.hasTileAt(x + 1, y)) {
            total++;
        }
        if(layer.hasTileAt(x, y + 1)) {
            total++;
        }
        return total;
    }

    private _calculateCardinality(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
        let cardinality = 0;

        if (layer.hasTileAt(x - 1, y - 1))
        {
            cardinality |= 1;
        }
        if (layer.hasTileAt(x, y - 1))
        {
            cardinality |= 2;
        }
        if (layer.hasTileAt(x + 1, y - 1))
        {
            cardinality |= 4;
        }
        if (layer.hasTileAt(x + 1, y))
        {
            cardinality |= 8;
        }
        if (layer.hasTileAt(x + 1, y + 1))
        {
            cardinality |= 16;
        }
        if (layer.hasTileAt(x, y + 1))
        {
            cardinality |= 32;
        }
        if (layer.hasTileAt(x - 1, y + 1))
        {
            cardinality |= 64;
        }
        if (layer.hasTileAt(x - 1, y))
        {
            cardinality |= 128;
        }
        return cardinality;
    }

    private _convertCardinalityToTilespace(cardinality: number) {
        //no top
        if (!(cardinality & 2))
        {
            //null corners
            cardinality &= ~1;
            cardinality &= ~4;
        }
        if (!(cardinality & 8))
        {
            cardinality &= ~4;
            cardinality &= ~16;
        }
        if (!(cardinality & 32))
        {
            cardinality &= ~16;
            cardinality &= ~64;
        }
        if (!(cardinality & 128))
        {
            cardinality &= ~1;
            cardinality &= ~64;
        }

        const left: boolean = (cardinality & 128) !== 0;
        const bottom: boolean = (cardinality & 32) !== 0;

        if (left != bottom)
        {
            cardinality &= ~64;
        }

        return cardinality;
    }
}