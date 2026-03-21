import "../qrpayment.css";

function QRpayment({
  totalDue = 0,
  orderNumber = "#A-000",
  paymentMethod = "card",
  onBack,
  onPaymentComplete,
}) {
  const totalText = `$${totalDue.toFixed(2)}`;
  const methodLabel = paymentMethod === "aba" ? "ABA Pay" : "QR / Card";

  return (
    <div className="qr-page">
      <div className="qr-meta">
        <span>Terminal: POS-01</span>
        <span>Session: #9422</span>
        <span>v2.4.1 stable build</span>
      </div>

      <div className="qr-card">
        <div className="qr-image" aria-label={`${methodLabel} QR Payment`}>
          <div className="qr-center-logo">$</div>
        </div>

        <h2>Scan this QR with {methodLabel}</h2>
        <p>
          Once the digital receipt is confirmed, tap &ldquo;I have completed payment&rdquo;
          to continue.
        </p>

        <div className="qr-summary">
          <div>
            <small>Order Number</small>
            <strong>{orderNumber}</strong>
          </div>
          <div>
            <small>Total Amount Due</small>
            <strong>{totalText}</strong>
          </div>
        </div>
      </div>

      <button className="qr-back-btn" onClick={onBack}>
        Go back
      </button>

      {onPaymentComplete && (
        <button className="qr-success-btn" onClick={onPaymentComplete}>
          I have completed payment
        </button>
      )}
    </div>
  );
}

export default QRpayment;
