interface ITeamConfig {
  startingCoins: number;
  players: number;
}

interface IStructureConfig {
  type: string;
  cost: number;
  hp: number;
}

interface IGameConfig {
  teams: ITeamConfig;
  structures: IStructureConfig[];
}

const gameConfig: IGameConfig = {
  teams: {
    startingCoins: 100,
    players: 2,
  },
  structures: [
    {
      type: "tower",
      cost: 10,
      hp: 100,
    },
    {
      type: "coingen",
      cost: 5,
      hp: 50,
    },
    {
      type: "wall",
      cost: 2,
      hp: 25,
    },
  ],
};

export default gameConfig;
