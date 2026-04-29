import "./AgentPanel.css";

export default function AgentPanel({
  fps,
  count,
  totalQueue,
  lastDecision,
  isRunning,
  onToggle,
  onRestart,
  agentMode,
  onModeChange,
}) {
  return (
    <aside className="city-panel">
      <h2>Панель агента</h2>

      <div className="city-panel__controls">
        <button type="button" onClick={onToggle}>
          {isRunning ? "Стоп" : "Старт"}
        </button>

        <button type="button" onClick={onRestart}>
          Перезапуск
        </button>
      </div>

      <div className="city-panel__mode">
        <span>Режим агента</span>

        <div className="city-panel__mode-buttons">
          <button
            type="button"
            className={agentMode === "rule" ? "is-active" : ""}
            onClick={() => onModeChange("rule")}
          >
            Rule
          </button>

          <button
            type="button"
            className={agentMode === "gemini" ? "is-active" : ""}
            onClick={() => onModeChange("gemini")}
          >
            Gemini
          </button>
        </div>
      </div>

      <div className="city-panel__row">
        <span>Статус</span>
        <strong>{isRunning ? "Работает" : "Пауза"}</strong>
      </div>

      <div className="city-panel__row">
        <span>FPS визуала</span>
        <strong>{fps}</strong>
      </div>

      <div className="city-panel__row">
        <span>Перекрёстков</span>
        <strong>{count}</strong>
      </div>

      <div className="city-panel__row">
        <span>Общая очередь</span>
        <strong>{totalQueue}</strong>
      </div>

      <div className="city-panel__decision">
        <span>Последнее решение</span>
        <p>{lastDecision}</p>
      </div>
    </aside>
  );
}