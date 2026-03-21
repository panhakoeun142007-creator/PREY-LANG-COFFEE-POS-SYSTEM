import "../style/order-confirmed.css";

const STAGES = ["Confirmed", "Brewing", "Ready", "Enjoy"];

function OrderConfirmed({
  orderNumber = "#BRW-000",
  estimatedMinutes = 8,
  onTrackStatus,
  onBackToMenu,
  currentStage = 0,
}) {
  const stageIndex = Math.max(0, Math.min(currentStage, STAGES.length - 1));
  const filledWidth = ((stageIndex + 1) / STAGES.length) * 100;

  return (
    <main className="order-confirmed-page">
      <section className="order-confirmed-card" aria-live="polite">
        <div className="order-confirmed-icon" aria-hidden="true">
          <span>✓</span>
        </div>
        <h1>Order confirmed!</h1>
        <p className="order-confirmed-subtitle">
          Your barista is brewing your coffee right now.
        </p>
        <button type="button" className="order-confirmed-code">
          {orderNumber}
        </button>

        <div className="order-progress">
          <div className="order-progress-label">PREPARATION STATUS</div>
          <div className="order-progress-line">
            <div className="order-progress-line-fill" style={{ width: `${filledWidth}%` }} />
          </div>
          <div className="order-progress-stages">
            {STAGES.map((label, index) => {
              const isActive = stageIndex === index;
              const isCompleted = stageIndex >= index;
              return (
                <div
                  key={label}
                  className={`order-stage ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                >
                  <span className="order-stage-dot">{isCompleted ? "✓" : index + 1}</span>
                  <small>{label}</small>
                </div>
              );
            })}
          </div>
        </div>

        <p className="order-estimate">
          Ready in approx. {estimatedMinutes} minute{estimatedMinutes === 1 ? "" : "s"}
        </p>

        <div className="order-confirmed-actions single">
          {onTrackStatus && (
            <button type="button" className="order-secondary-btn" onClick={onTrackStatus}>
              Track order status
            </button>
          )}
          {onBackToMenu && (
            <button type="button" className="order-link" onClick={onBackToMenu}>
              Back to menu
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default OrderConfirmed;
