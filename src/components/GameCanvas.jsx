import { useEffect, useRef, useState } from 'react'
import {
  BACKGROUND_STARS,
  BRICK_COLORS,
  BRICK_ROWS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INITIAL_LIVES,
} from '../game/config'
import { createBrickField, createInitialState, resetRound } from '../game/level'
import {
  clamp,
  circleRectCollision,
  normalize,
  reflectBallFromPaddle,
} from '../game/physics'

const clampPaddle = (state) =>
  clamp(state.paddle.x, 0, CANVAS_WIDTH - state.paddle.width)

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function GameCanvas() {
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const keysRef = useRef({
    ArrowLeft: false,
    ArrowRight: false,
    a: false,
    d: false,
    A: false,
    D: false,
  })
  const gameRef = useRef(createInitialState())

  const [hud, setHud] = useState(() => ({
    score: 0,
    lives: INITIAL_LIVES,
    levelCleared: false,
    isPlaying: false,
    isGameOver: false,
    bricksLeft: BRICK_ROWS * createBrickField().columns,
  }))

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        const game = gameRef.current

        if (!game.roundActive && !game.isGameOver && !game.levelCleared) {
          game.roundActive = true
          setHud((current) => ({ ...current, isPlaying: true }))
        } else if (game.isGameOver || game.levelCleared) {
          const nextGame = createInitialState()
          gameRef.current = nextGame
          setHud({
            score: nextGame.score,
            lives: nextGame.lives,
            levelCleared: false,
            isPlaying: false,
            isGameOver: false,
            bricksLeft: nextGame.bricks.filter((brick) => !brick.destroyed).length,
          })
        }
      }

      if (event.key in keysRef.current) {
        keysRef.current[event.key] = true
      }
    }

    const handleKeyUp = (event) => {
      if (event.key in keysRef.current) {
        keysRef.current[event.key] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const handlePointerMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_WIDTH / rect.width
      const pointerX = (event.clientX - rect.left) * scaleX
      const game = gameRef.current

      game.paddle.x = clamp(pointerX - game.paddle.width / 2, 0, CANVAS_WIDTH - game.paddle.width)

      if (!game.roundActive) {
        game.ball.x = game.paddle.x + game.paddle.width / 2
        game.ball.y = game.paddle.y - game.ball.radius - 2
      }
    }

    canvas.addEventListener('pointermove', handlePointerMove)

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx) {
      return undefined
    }

    const updateHud = (game) => {
      setHud((current) => {
        const next = {
          score: game.score,
          lives: game.lives,
          levelCleared: game.levelCleared,
          isPlaying: game.roundActive,
          isGameOver: game.isGameOver,
          bricksLeft: game.bricks.filter((brick) => !brick.destroyed).length,
        }

        if (
          current.score === next.score &&
          current.lives === next.lives &&
          current.levelCleared === next.levelCleared &&
          current.isPlaying === next.isPlaying &&
          current.isGameOver === next.isGameOver &&
          current.bricksLeft === next.bricksLeft
        ) {
          return current
        }

        return next
      })
    }

    const draw = (game) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, '#081327')
      gradient.addColorStop(0.6, '#102347')
      gradient.addColorStop(1, '#140d24')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      BACKGROUND_STARS.forEach((star) => {
        ctx.fillStyle = star.color
        ctx.globalAlpha = star.alpha
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      game.bricks.forEach((brick) => {
        if (brick.destroyed) {
          return
        }

        const brickGradient = ctx.createLinearGradient(
          brick.x,
          brick.y,
          brick.x,
          brick.y + brick.height,
        )
        brickGradient.addColorStop(0, BRICK_COLORS[brick.row].light)
        brickGradient.addColorStop(1, BRICK_COLORS[brick.row].dark)

        drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 8)
        ctx.fillStyle = brickGradient
        ctx.fill()

        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.stroke()
      })

      ctx.shadowColor = 'rgba(72, 236, 255, 0.45)'
      ctx.shadowBlur = 14
      drawRoundedRect(
        ctx,
        game.paddle.x,
        game.paddle.y,
        game.paddle.width,
        game.paddle.height,
        12,
      )
      const paddleGradient = ctx.createLinearGradient(
        game.paddle.x,
        game.paddle.y,
        game.paddle.x,
        game.paddle.y + game.paddle.height,
      )
      paddleGradient.addColorStop(0, '#f8fafc')
      paddleGradient.addColorStop(1, '#60a5fa')
      ctx.fillStyle = paddleGradient
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.beginPath()
      ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2)
      const ballGradient = ctx.createRadialGradient(
        game.ball.x - 4,
        game.ball.y - 4,
        2,
        game.ball.x,
        game.ball.y,
        game.ball.radius,
      )
      ballGradient.addColorStop(0, '#ffffff')
      ballGradient.addColorStop(0.45, '#fde68a')
      ballGradient.addColorStop(1, '#f97316')
      ctx.fillStyle = ballGradient
      ctx.shadowColor = 'rgba(249, 115, 22, 0.55)'
      ctx.shadowBlur = 18
      ctx.fill()
      ctx.shadowBlur = 0

      if (!game.roundActive && !game.isGameOver && !game.levelCleared) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
        ctx.font = '700 26px "Trebuchet MS", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Press Space to Launch', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      }

      if (game.isGameOver || game.levelCleared) {
        ctx.fillStyle = 'rgba(3, 7, 18, 0.65)'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.fillStyle = '#f8fafc'
        ctx.textAlign = 'center'
        ctx.font = '700 34px "Trebuchet MS", sans-serif'
        ctx.fillText(
          game.levelCleared ? 'Level Cleared' : 'Game Over',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 - 18,
        )
        ctx.font = '500 19px "Trebuchet MS", sans-serif'
        ctx.fillText(
          'Press Restart or Space to play again',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 18,
        )
      }
    }

    const advanceBall = (game, dt) => {
      const distance = Math.max(Math.abs(game.ball.vx * dt), Math.abs(game.ball.vy * dt))
      const steps = Math.max(1, Math.ceil(distance / game.ball.radius))
      const stepDt = dt / steps

      for (let step = 0; step < steps; step += 1) {
        game.ball.x += game.ball.vx * stepDt
        game.ball.y += game.ball.vy * stepDt

        if (game.ball.x - game.ball.radius <= 0) {
          game.ball.x = game.ball.radius
          game.ball.vx = Math.abs(game.ball.vx)
        } else if (game.ball.x + game.ball.radius >= CANVAS_WIDTH) {
          game.ball.x = CANVAS_WIDTH - game.ball.radius
          game.ball.vx = -Math.abs(game.ball.vx)
        }

        if (game.ball.y - game.ball.radius <= 0) {
          game.ball.y = game.ball.radius
          game.ball.vy = Math.abs(game.ball.vy)
        }

        if (game.ball.y - game.ball.radius > CANVAS_HEIGHT) {
          game.lives -= 1

          if (game.lives <= 0) {
            game.isGameOver = true
            game.roundActive = false
          } else {
            resetRound(game)
          }

          return
        }

        const paddleHit = circleRectCollision(game.ball, game.paddle)
        if (paddleHit && game.ball.vy > 0) {
          reflectBallFromPaddle(game.ball, game.paddle, paddleHit)
          continue
        }

        let brickBroken = false

        for (const brick of game.bricks) {
          if (brick.destroyed) {
            continue
          }

          const hit = circleRectCollision(game.ball, brick)
          if (!hit) {
            continue
          }

          brick.destroyed = true
          game.score += brick.points
          game.ball.x += hit.normal.x * hit.overlap
          game.ball.y += hit.normal.y * hit.overlap

          if (Math.abs(hit.normal.x) > 0.35 && Math.abs(hit.normal.y) > 0.35) {
            if (Math.abs(game.ball.vx) > Math.abs(game.ball.vy)) {
              game.ball.vx *= -1
            } else {
              game.ball.vy *= -1
            }
          } else if (Math.abs(hit.normal.x) > Math.abs(hit.normal.y)) {
            game.ball.vx *= -1
          } else {
            game.ball.vy *= -1
          }

          const speed = Math.hypot(game.ball.vx, game.ball.vy)
          const accelerated = Math.min(speed + 12, game.ball.maxSpeed)
          const velocity = normalize(game.ball.vx, game.ball.vy)
          game.ball.vx = velocity.x * accelerated
          game.ball.vy = velocity.y * accelerated
          brickBroken = true
          break
        }

        if (brickBroken) {
          break
        }
      }
    }

    const update = (deltaSeconds) => {
      const game = gameRef.current
      const moveLeft = keysRef.current.ArrowLeft || keysRef.current.a || keysRef.current.A
      const moveRight =
        keysRef.current.ArrowRight || keysRef.current.d || keysRef.current.D
      const direction = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0)

      game.paddle.x += direction * game.paddle.speed * deltaSeconds
      game.paddle.x = clampPaddle(game)

      if (!game.roundActive) {
        game.ball.x = game.paddle.x + game.paddle.width / 2
        game.ball.y = game.paddle.y - game.ball.radius - 2
        updateHud(game)
        return
      }

      advanceBall(game, deltaSeconds)

      if (game.bricks.every((brick) => brick.destroyed)) {
        game.levelCleared = true
        game.roundActive = false
      }

      updateHud(game)
    }

    const frame = (time) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
      }

      const deltaSeconds = Math.min((time - lastTimeRef.current) / 1000, 1 / 30)
      lastTimeRef.current = time

      update(deltaSeconds)
      draw(gameRef.current)
      animationFrameRef.current = window.requestAnimationFrame(frame)
    }

    animationFrameRef.current = window.requestAnimationFrame(frame)

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const handleRestart = () => {
    const nextGame = createInitialState()
    gameRef.current = nextGame
    lastTimeRef.current = 0
    setHud({
      score: nextGame.score,
      lives: nextGame.lives,
      levelCleared: false,
      isPlaying: false,
      isGameOver: false,
      bricksLeft: nextGame.bricks.filter((brick) => !brick.destroyed).length,
    })
  }

  return (
    <section className="game-panel">
      <div className="hud" aria-label="Game status">
        <div className="stat-card">
          <span className="stat-label">Score</span>
          <strong>{hud.score}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Lives</span>
          <strong>{hud.lives}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Bricks Left</span>
          <strong>{hud.bricksLeft}</strong>
        </div>
        <button type="button" className="restart-button" onClick={handleRestart}>
          Restart
        </button>
      </div>

      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
          aria-label="DX Ball game board"
        />
      </div>

      <p className="status-text" role="status">
        {hud.levelCleared
          ? 'Every brick is gone. Tap restart for another round.'
          : hud.isGameOver
            ? 'The ball slipped past the paddle. Restart when you are ready.'
            : hud.isPlaying
              ? 'Keep the rally alive and use the paddle edge to steer the shot.'
              : 'Press Space to serve the ball and start the round.'}
      </p>
    </section>
  )
}

export default GameCanvas