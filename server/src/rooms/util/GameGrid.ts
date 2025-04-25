import { ITilesetterData } from "../../../../types";
import { Entity } from "../schema/GameState";

const TileTypes = {
    Grass: 0,
    Obstacle: 1,
    Structure: 2
} as const

type INav = {
    cost?: number
}

type IGrass = INav & {
    type: typeof TileTypes.Grass,
    cost: 0
}

const grass = (): IGrass => ({ type: TileTypes.Grass, cost: 0 })

type IObstacle = INav & {
    type: typeof TileTypes.Obstacle
};

const obstacle = (): IObstacle => ({ type: TileTypes.Obstacle });

type IStructure = INav & {
    type: typeof TileTypes.Structure,
    cost: number,
    entity: Entity,
    team: number
}

export const Structure = (entity: Entity, cost: number, team: number): IStructure => ({
    type: TileTypes.Structure,
    cost,
    entity,
    team
});

type ITile = IStructure | IObstacle | IGrass;

export class GameGrid {
    private _structures: (IStructure | undefined)[][];
    private _walls: (IStructure | undefined)[][];
    private _obstacles: (IObstacle | undefined)[][];

    private _collisionMap: ITile | undefined[][];
    constructor(
        private _tileSetterData: ITilesetterData
    ) {
        const { map_width: w, map_height: h } = _tileSetterData;
        this._structures = this._initializeLayer(w, h);
        this._walls = this._initializeLayer(w, h);
        this._obstacles = this._initializeLayer(w, h);

        const obstacles = _tileSetterData.layers.find(layer => layer.name === 'Obstacle');
        if (obstacles !== undefined) {
            for (const position of obstacles.positions) {
                this._obstacles[position.x][position.y] = obstacle();
            }
        }
    }

    private _initializeLayer<T>(w: number, h: number, defaultValue?: T): T[][] {
        let t: T[][] = [];
        for (let i = 0; i < w; i++) {
            t[i] = [];
            for (let j = 0; j < h; j++) {
                t[i][j] = defaultValue;
            }
        }
        return t;
    }
}