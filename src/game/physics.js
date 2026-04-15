export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const normalize = (x, y) => {
  const length = Math.hypot(x, y) || 1
  return { x: x / length, y: y / length }
}

export const circleRectCollision = (circle, rect) => {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width)
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height)
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  const distanceSquared = dx * dx + dy * dy

  if (distanceSquared > circle.radius * circle.radius) {
    return null
  }

  if (distanceSquared === 0) {
    const distances = [
      { axis: 'left', value: Math.abs(circle.x - rect.x), normal: { x: -1, y: 0 } },
      {
        axis: 'right',
        value: Math.abs(circle.x - (rect.x + rect.width)),
        normal: { x: 1, y: 0 },
      },
      { axis: 'top', value: Math.abs(circle.y - rect.y), normal: { x: 0, y: -1 } },
      {
        axis: 'bottom',
        value: Math.abs(circle.y - (rect.y + rect.height)),
        normal: { x: 0, y: 1 },
      },
    ].sort((a, b) => a.value - b.value)

    return {
      normal: distances[0].normal,
      overlap: circle.radius,
      axis: distances[0].axis,
    }
  }

  const distance = Math.sqrt(distanceSquared)
  const normal = { x: dx / distance, y: dy / distance }
  const overlap = circle.radius - distance

  return {
    normal,
    overlap,
    axis: Math.abs(normal.x) > Math.abs(normal.y) ? 'x' : 'y',
  }
}

export const reflectBallFromPaddle = (ball, paddle, hit) => {
  const relativeIntersect = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)
  const clamped = clamp(relativeIntersect, -1, 1)
  const maxBounceAngle = (70 * Math.PI) / 180
  const bounceAngle = clamped * maxBounceAngle
  const speed = Math.min(Math.hypot(ball.vx, ball.vy) + 8, ball.maxSpeed)

  ball.x += hit.normal.x * hit.overlap
  ball.y = paddle.y - ball.radius - 0.5
  ball.vx = speed * Math.sin(bounceAngle)
  ball.vy = -Math.abs(speed * Math.cos(bounceAngle))
}