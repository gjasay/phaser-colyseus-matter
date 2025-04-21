import FastPriorityQueue from "fastpriorityqueue";
import { Vector } from "matter-js";

type Priority<T> = {
    data: T,
    priority: number
};

export class VectorMap<T> {
    private _map: Map<number, T> = new Map<number, T>();

    private _hash(vector: Vector): number {
        return (vector.x << 8) | vector.y;
    }

    public get(vector: Vector): T | undefined {
        return this._map.get(this._hash(vector));
    }

    public set(vector: Vector, t: T): void {
        this._map.set(this._hash(vector), t);
    }

    public has(vector: Vector): boolean {
        return this._map.has(this._hash(vector));
    }
}

const prioritize = <T>(t: T, priority: number): Priority<T> => ({
    data: t,
    priority
});

const getNeighbors = (pos: Vector, map: boolean[][]) => {
    const neighbors: Vector[] = [];
    if (pos.x > 0 && !map[pos.x - 1][pos.y]) {
        neighbors.push(Vector.create(pos.x - 1, pos.y)) // left
    }
    if (pos.x < 127 && !map[pos.x + 1][pos.y]) {
        neighbors.push(Vector.create(pos.x + 1, pos.y)) // right
    }
    if (pos.y > 0 && !map[pos.x][pos.y - 1]) {
        neighbors.push(Vector.create(pos.x, pos.y - 1)) // top
    }
    if (pos.y < 127 && !map[pos.x][pos.y + 1]) {
        neighbors.push(Vector.create(pos.x, pos.y + 1)) // bottom
    }
    return neighbors;
}

/* Manhattan distance */
const heuristic = (destination: Vector, next: Vector) =>
    Math.abs(destination.x - next.x) + Math.abs(destination.y - next.y);

export function Navigate(origin: Vector, destination: Vector, map: boolean[][]) {
    const florigin = Vector.create(origin.x, origin.y)
    const frontier = new FastPriorityQueue<Priority<Vector>>((a, b) => a.priority < b.priority);
    frontier.add(prioritize(florigin, 0));

    const cameFrom: VectorMap<Vector | null> = new VectorMap<Vector | null>();
    const costSoFar: VectorMap<number> = new VectorMap<number>();

    cameFrom.set(florigin, null);
    costSoFar.set(florigin, 0);

    while (!frontier.isEmpty()) {
        const { data: current } = frontier.poll();
        if (current.x == destination.x && current.y == destination.y) {
            break;
        }
        for (const neighbor of getNeighbors(current, map)) {
            const newCost = (costSoFar.get(current) ?? 0) + 1;
            if (!costSoFar.has(neighbor) || newCost < costSoFar.get(neighbor)) {
                costSoFar.set(neighbor, newCost);
                const priority = newCost + heuristic(destination, neighbor);
                frontier.add(prioritize(neighbor, priority));
                cameFrom.set(neighbor, current);
            }
        }
    }

    return cameFrom;
}