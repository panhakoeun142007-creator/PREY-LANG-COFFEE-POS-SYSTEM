import "../ready.css";

const STATUS_TEXT = "READY FOR PICKUP";
const DEFAULT_THANK_YOU_TEXT = "Thank you for visiting!";
const DEFAULT_RECEIPT_MESSAGE =
  "Your payment receipt has been generated. Please collect your order from the counter.";

function Ready({ tableNumber = "012", onEnjoyCoffee, snapshot, receiptSettings }) {
  // Use settings from props if available, otherwise use defaults
  const shopName = receiptSettings?.shop_name || "Prey Lang Coffee";
  const shopAddress = receiptSettings?.address || "Street 214, Phnom Penh, Cambodia";
  const shopPhone = receiptSettings?.phone || "+855 12 345 678";
  const footerMessage = receiptSettings?.footer_message || DEFAULT_RECEIPT_MESSAGE;
  const showLogo = receiptSettings?.show_logo !== false;
  const showQrPayment = receiptSettings?.show_qr_payment !== false;
  
  // Get payment type from snapshot
  const paymentType = snapshot?.paymentType;
  
  const tableText = `Table: ${tableNumber}`;
  const items = snapshot?.items ?? [];
  const subtotal = snapshot?.subtotal ?? 0;
  const taxAmount = snapshot?.taxAmount ?? 0;
  const total = snapshot?.total ?? subtotal + taxAmount;
  const taxPerItem = snapshot?.taxPerItem;

  return (
    <main className="ready-page ready-page--receipt">
      <section className="ready-card ready-card--receipt" aria-label="Order ready receipt">
        <small className="receipt-header-caption">{STATUS_TEXT}</small>
        <h1 className="receipt-title">Your Payment</h1>
        <div className="receipt-brand">
          {showLogo && (
            <div className="receipt-logo">
              <img src="/img/logo-coffee.png" alt="Logo" className="receipt-logo-img" />
            </div>
          )}
          <span className="receipt-brand-name">{shopName}</span>
          <p>{shopAddress} · Tel: {shopPhone}</p>
        </div>
        <div className="receipt-table">{tableText}</div>

        <ul className="receipt-items">
          {items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="receipt-item">
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.quantity}× ${item.unitPrice.toFixed(2)}
                </span>
              </div>
              <strong>${item.lineTotal.toFixed(2)}</strong>
            </li>
          ))}
        </ul>

        <div className="receipt-totals">
          <div>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>{typeof taxPerItem === "number" ? `Tax ($${taxPerItem.toFixed(2)}/item)` : "Tax"}</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="receipt-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Only show QR code for non-cash payments */}
        {showQrPayment && paymentType && paymentType.toLowerCase() !== 'cash' && (
          <div className="receipt-qr">
            <div className="receipt-qr-icon">📱</div>
            <span className="receipt-qr-text">Scan To Pay</span>
          </div>
        )}

        <p className="ready-message secondary">{footerMessage}</p>

        <button className="ready-primary-btn ready-primary-btn--minimal" type="button" onClick={onEnjoyCoffee}>
          Enjoy your coffee
        </button>
      </section>
    </main>
  );
}

export default Ready;
