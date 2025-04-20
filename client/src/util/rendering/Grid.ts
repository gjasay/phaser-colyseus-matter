type Tile = {
  neighborhood: number;
  cardinality: number;
  trueCardinality: number;
};

export type TStructure = "coingen" | "tower" | "wall";

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
  171: 46,
} as const;

export class Grid {
  private _tilemap: Phaser.Tilemaps.Tilemap;
  private _ground: Phaser.Tilemaps.TilemapLayer;
  private _walls: Phaser.Tilemaps.TilemapLayer;
  private _structures: Phaser.Tilemaps.TilemapLayer;

  constructor(
    private _scene: Phaser.Scene,
    private readonly _w: number,
    private readonly _h: number,
  ) {
    this._tilemap = this._scene.make.tilemap({
      width: this._w,
      height: this._h,
      tileWidth: 32,
      tileHeight: 32,
    });
    // const groundTileset = this._tilemap.addTilesetImage('ground');
    const wallTileset = this._tilemap.addTilesetImage("walls");
    const structureTileset = this._tilemap.addTilesetImage("structures");
    if (wallTileset === null) {
      throw new Error("Missing tilesets in grid");
    }

    // const ground = this._tilemap.createBlankLayer('ground', groundTileset);
    const walls = this._tilemap.createBlankLayer("walls", wallTileset);

    if (structureTileset === null) {
      throw new Error("Missing tilesets in grid");
    }

    const structures = this._tilemap.createBlankLayer(
      "structures",
      structureTileset,
    );

    if (walls === null) {
      throw new Error("Missing wall layer in grid");
    }

    if (structures === null) {
      throw new Error("Missing structure layer in grid");
    }

    this._walls = walls;
    this._structures = structures;
  }

  // Use to place a structures on the grid
  public placeStructure(type: TStructure, x: number, y: number): boolean {
    if (this._walls.hasTileAt(x, y) || this._structures.hasTileAt(x, y))
      return false;

    // Add new types of structures here and update TStructure
    switch (type) {
      case "coingen":
        this._structures.putTileAt(0, x, y);
        return true;
      case "tower":
        this._structures.putTileAt(1, x, y);
        return true;
      case "wall":
        this.placeWall(x, y);
        return true;
    }
  }

  public placeWall(x: number, y: number): boolean {
    if (this._walls.hasTileAt(x, y)) {
      return false;
    }
    this._walls.putTileAt(0, x, y);
    this._redrawTile(this._walls, x, y);
    return true;
  }

  public removeWall(x: number, y: number) {
    this._walls.removeTileAt(x, y);
    this._redrawTile(this._walls, x, y);
  }

  private _redrawTile(
    layer: Phaser.Tilemaps.TilemapLayer,
    x: number,
    y: number,
  ) {
    this.forEachNeighbor(layer, x, y, (layer, _x, _y) => {
      this._calculateCellNeighbor(layer, _x, _y), this._drawTile(layer, _x, _y);
    });
    this._drawTile(layer, x, y);
  }

  private _drawTile(layer: Phaser.Tilemaps.TilemapLayer, x: number, y: number) {
    const tile = layer.getTileAt(x, y);
    if (tile !== null) {
      const cardinality = tile.properties.cardinality;
      layer.putTileAt(CardinalityMap[cardinality], x, y);
    }
  }

  private forEachNeighbor(
    layer: Phaser.Tilemaps.TilemapLayer,
    x: number,
    y: number,
    callback: (
      layer: Phaser.Tilemaps.TilemapLayer,
      x: number,
      y: number,
    ) => void,
  ) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        callback(layer, x + i, y + j);
      }
    }
  }

  private _calculateCellNeighbor(
    layer: Phaser.Tilemaps.TilemapLayer,
    x: number,
    y: number,
  ) {
    const tile = layer.getTileAt(x, y, true);
    if (tile === null) {
      return;
    }
    const properties = tile.properties as Tile;
    properties.neighborhood = this._calculateImmediateNeighborhood(layer, x, y);
    properties.trueCardinality = this._calculateCardinality(layer, x, y);
    properties.cardinality = this._convertCardinalityToTilespace(
      properties.trueCardinality,
    );
  }

  private _drawSeamlessTile(
    layer: Phaser.Tilemaps.TilemapLayer,
    x: number,
    y: number,
  ) {}

  private _calculateImmediateNeighborhood(
    layer: Phaser.Tilemaps.TilemapLayer,
    x: number,
    y: number,
  ) {
    let total = 0;
    if (layer.hasTileAt(x, y - 1)) {
      total++;
    }
    if (layer.hasTileAt(x - 1, y)) {
      total++;
    }
    if (layer.hasTileAt(x + 1, y)) {
      total++;
    }
    if (layer.hasTileAt(x, y + 1)) {
      total++;
    }
    return total;
  }

  private _calculateCardinality(
    layer: Phaser.Tilemaps.TilemapLayer,
    x: number,
    y: number,
  ) {
    let cardinality = 0;

    if (layer.hasTileAt(x - 1, y - 1)) {
      cardinality |= 1;
    }
    if (layer.hasTileAt(x, y - 1)) {
      cardinality |= 2;
    }
    if (layer.hasTileAt(x + 1, y - 1)) {
      cardinality |= 4;
    }
    if (layer.hasTileAt(x + 1, y)) {
      cardinality |= 8;
    }
    if (layer.hasTileAt(x + 1, y + 1)) {
      cardinality |= 16;
    }
    if (layer.hasTileAt(x, y + 1)) {
      cardinality |= 32;
    }
    if (layer.hasTileAt(x - 1, y + 1)) {
      cardinality |= 64;
    }
    if (layer.hasTileAt(x - 1, y)) {
      cardinality |= 128;
    }
    return cardinality;
  }

  private _convertCardinalityToTilespace(cardinality: number) {
    //no top
    if (!(cardinality & 2)) {
      //null corners
      cardinality &= ~1;
      cardinality &= ~4;
    }
    if (!(cardinality & 8)) {
      cardinality &= ~4;
      cardinality &= ~16;
    }
    if (!(cardinality & 32)) {
      cardinality &= ~16;
      cardinality &= ~64;
    }
    if (!(cardinality & 128)) {
      cardinality &= ~1;
      cardinality &= ~64;
    }

    const left: boolean = (cardinality & 128) !== 0;
    const bottom: boolean = (cardinality & 32) !== 0;

    if (left != bottom) {
      cardinality &= ~64;
    }

    return cardinality;
  }
}
