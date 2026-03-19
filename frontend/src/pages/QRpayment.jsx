import "../qrpayment.css";

function QRpayment({ totalDue = 0, orderNumber = "#A-000", onBack }) {
  const totalText = `$${totalDue.toFixed(2)}`;

  return (
    <div className="qr-page">
      <div className="qr-meta">
        <span>Terminal: POS-01</span>
        <span>Session: #9422</span>
        <span>v2.4.1 stable build</span>
      </div>

      <div className="qr-card">
        <div className="qr-image" aria-label="QR Payment Code">
          <div className="qr-center-logo">$</div>
        </div>

        <h2>Please proceed to the counter to complete your payment</h2>
        <p>A barista will assist you with cash or physical voucher payments shortly.</p>

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
        {"Go Back"} 
      </button>
      <button className="qr-pay-btn" onClick={() => window.location.reload() || onPickupReady?.()}>
        Payment Complete - Check Status
      </button>
    </div>
  );
}

export default QRpayment;
