import "../ready.css";

const STATUS_TEXT = "READY FOR PICKUP";
const THANK_YOU_TEXT = "Thank you for visiting!";
const RECEIPT_MESSAGE =
  "Your payment receipt has been generated. Please collect your order from the counter.";

function Ready({ tableNumber = "012", onEnjoyCoffee, snapshot }) {
  const tableText = `Table: ${tableNumber}`;
  const items = snapshot?.items ?? [];
  const subtotal = snapshot?.subtotal ?? 0;
  const taxAmount = snapshot?.taxAmount ?? 0;
  const total = snapshot?.total ?? subtotal + taxAmount;

  return (
    <main className="ready-page ready-page--receipt">
      <section className="ready-card ready-card--receipt" aria-label="Order ready receipt">
        <small className="receipt-header-caption">{STATUS_TEXT}</small>
        <h1 className="receipt-title">Your Payment</h1>
        <div className="receipt-brand">
          <span className="receipt-brand-name">Makara Coffee</span>
          <p>Street 123, Phnom Penh · Tel: 012 345 678</p>
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
            <span>Tax (10%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="receipt-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <p className="ready-message secondary">{RECEIPT_MESSAGE}</p>

        <button className="ready-primary-btn ready-primary-btn--minimal" type="button" onClick={onEnjoyCoffee}>
          Enjoy your coffee
        </button>
      </section>
    </main>
  );
}

export default Ready;
