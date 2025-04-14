interface IPlayerConfig {
  radius: number;
  walkSpeed: number;
  jumpForce: number;
  airTime: number;
  jumpTimeout: number;
  friction: number;
  frictionAir: number;
  mass: number;
}

const playerConfig: IPlayerConfig = {
  radius: 25,
  walkSpeed: 0.00001,
  jumpForce: 0.000025,
  airTime: 100,
  jumpTimeout: 175,
  friction: 0.5,
  frictionAir: 0.05,
  mass: 0.01
}

export default playerConfig;
