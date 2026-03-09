import "../qrpayment.css";

function QRpayment({ totalDue = 0, orderNumber = "#A-000", onBack }) {
  const tax = totalDue * 0.1;
  const finalTotal = totalDue + tax;

  return (
    <div className="qr-page">
      <div className="qr-meta">
        <span>Order {orderNumber}</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>

      <div className="qr-card">
        <div className="qr-image">
          <div className="qr-center-logo">C</div>
        </div>
        <h2>Scan to Pay</h2>
        <p>Use your banking app to scan the QR code above</p>

        <div className="qr-summary">
          <div>
            <small>Order Total</small>
            <strong>${finalTotal.toFixed(2)}</strong>
          </div>
          <div>
            <small>Payment</small>
            <strong>KHQR / Card</strong>
          </div>
        </div>
      </div>

      <button className="qr-back-btn" type="button" onClick={onBack}>
        BACK
      </button>
    </div>
  );
}

export default QRpayment;
