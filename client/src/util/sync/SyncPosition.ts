import Phaser from 'phaser';

export function syncPosition(
  currentX: number,
  currentY: number,
  serverState: { x: number; y: number; velocityX?: number; velocityY?: number },
  setPosition: (x: number, y: number) => void,
  setVelocity: (vx: number, vy: number) => void,
  body?: Phaser.Types.Physics.Matter.MatterBody
) {
  const distance = Phaser.Math.Distance.Between(
    currentX,
    currentY,
    serverState.x,
    serverState.y,
  );

  if (distance > 1) {
    const correctionFactorPosition = 0.1;
    const correctionFactorVelocity = 0.2;

    const deltaX = serverState.x - currentX;
    const deltaY = serverState.y - currentY;

    // Gently adjust position
    setPosition(
      currentX + deltaX * correctionFactorPosition,
      currentY + deltaY * correctionFactorPosition,
    );

    if (!body) return;

    // Gently adjust velocity
    if (serverState.velocityX !== undefined && serverState.velocityY !== undefined) {
      //@ts-expect-error SHUT THE FUCK UP
      setVelocity( body.velocity.x + (serverState.velocityX - body.velocity.x) * correctionFactorVelocity, body.velocity.y + (serverState.velocityY - body.velocity.y) * correctionFactorVelocity,);
    }
  } else if (distance > 0.01) {
    // Small correction even for minor discrepancies
    const correctionFactorSmall = 0.05;
    const deltaX = serverState.x - currentX;
    const deltaY = serverState.y - currentY;

    setPosition(
      currentX + deltaX * correctionFactorSmall,
      currentY + deltaY * correctionFactorSmall,
    );
  }
}
