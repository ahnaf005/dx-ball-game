import {
  BALL_MAX_SPEED,
  BALL_RADIUS,
  BALL_SPEED,
  BRICK_COLUMNS,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_OFFSET_LEFT,
  BRICK_OFFSET_TOP,
  BRICK_ROWS,
  BRICK_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INITIAL_LIVES,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_SPEED,
} from './config'

export const createBrickField = () => {
  const bricks = []

  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let column = 0; column < BRICK_COLUMNS; column += 1) {
      bricks.push({
        id: `${row}-${column}`,
        row,
        column,
        x: BRICK_OFFSET_LEFT + column * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        destroyed: false,
        points: (BRICK_ROWS - row) * 10,
      })
    }
  }

  return { bricks, columns: BRICK_COLUMNS }
}

export const createInitialState = () => {
  const { bricks } = createBrickField()
  const paddle = {
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: CANVAS_HEIGHT - 44,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
  }

  return {
    score: 0,
    lives: INITIAL_LIVES,
    isGameOver: false,
    levelCleared: false,
    roundActive: false,
    paddle,
    ball: {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - BALL_RADIUS - 2,
      radius: BALL_RADIUS,
      vx: BALL_SPEED * 0.55,
      vy: -BALL_SPEED,
      maxSpeed: BALL_MAX_SPEED,
    },
    bricks,
  }
}

export const resetRound = (game) => {
  game.roundActive = false
  game.paddle.x = (CANVAS_WIDTH - game.paddle.width) / 2
  game.ball.x = game.paddle.x + game.paddle.width / 2
  game.ball.y = game.paddle.y - game.ball.radius - 2
  game.ball.vx = BALL_SPEED * 0.55
  game.ball.vy = -BALL_SPEED
}