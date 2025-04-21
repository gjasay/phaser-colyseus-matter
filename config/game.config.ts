interface ITeamConfig {
  coins: number;
  players: number;
}

interface IStructureConfig {
  cost: number;
  hp: number;
}

interface IGameConfig {
  teams: ITeamConfig;
  structures: {
    tower: IStructureConfig;
    coingen: IStructureConfig;
    wall: IStructureConfig;
  }
}

const gameConfig: IGameConfig = {
  teams: {
    coins: 100,
    players: 2,
  },
  structures: {
    tower: {
      cost: 10,
      hp: 100,
    },
    coingen: {
      cost: 5,
      hp: 50,
    },
    wall: {
      cost: 1,
      hp: 10,
    },
      },
  };

export default gameConfig;
