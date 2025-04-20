import { Bodies, Composite } from "matter-js";
import { ITilesetterData } from "../../../../types";

export async function loadCollisionLayer(
  engine: Matter.Engine,
  mapData: ITilesetterData,
) {
  const obstacleLayer = mapData.layers.find(
    (layer) => layer.name === "Obstacle",
  );

  if (obstacleLayer && obstacleLayer.positions) {
    obstacleLayer.positions.forEach((pos) => {
      const body = Bodies.rectangle(
        pos.x * mapData.tile_size + mapData.tile_size / 2,
        pos.y * mapData.tile_size + mapData.tile_size / 2,
        mapData.tile_size,
        mapData.tile_size,
        {
          isStatic: true,
          collisionFilter: {
            category: 0b0010,
            mask: 0b1111,
          },
        },
      );
      Composite.add(engine.world, body);
    });
  }
}
