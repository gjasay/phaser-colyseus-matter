interface IPhysicsConfig {
  gravity: {
    x: number;
    y: number;
    scale: number;
  };
  velocityIterations: number;
  positionIterations: number;
  worldBounds: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  };
}

const physicsConfig: IPhysicsConfig = {
  gravity: { x: 0, y: 0.1, scale: 0.01 },
  velocityIterations: 1,
  positionIterations: 1,
  worldBounds: {
    min: { x: 50, y: 50 },
    max: { x: 2100, y: 750 },
  },
};

export default physicsConfig;
