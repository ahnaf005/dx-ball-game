import GameCanvas from './components/GameCanvas'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Canvas Arcade</p>
          <h1>DX Ball</h1>
          <p className="hero-text">
            Break every brick, bend the ball with the paddle, and chase a clean
            high score.
          </p>
        </div>
        <div className="legend" aria-label="Controls">
          <span>
            <kbd>Left</kbd>
            <kbd>Right</kbd>
            Move
          </span>
          <span>
            <kbd>A</kbd>
            <kbd>D</kbd>
            Alternate
          </span>
          <span>
            <kbd>Space</kbd>
            Launch
          </span>
        </div>
      </section>

      <GameCanvas />
    </main>
  )
}

export default App