import "../ready.css";
import logo from "../img/image.png";

const BRAND_NAME = "The Daily Grind";
const STATUS_TEXT = "READY FOR PICKUP";
const THANK_YOU_TEXT = "Thank You For Visiting!";
const PICKUP_MESSAGE = "Your order is freshly brewed and ready for pickup at the counter!";

function Ready({ tableNumber = "012", onBack, onEnjoyCoffee }) {
  const tableText = `TABLE ${tableNumber}`;

  return (
    <main className="ready-page">
      <header className="ready-header">
        <div className="ready-header-left">
          <button
            className="ready-back-btn"
            type="button"
            onClick={onBack}
            aria-label="Back to status"
          >
            {"<"}
          </button>

          <div className="ready-brand">
            <img src={logo} alt="Prey Lang Coffee" />
            <span>{BRAND_NAME}</span>
          </div>
        </div>

        <p className="ready-location">YOU ARE AT {tableText}</p>
      </header>

      <section className="ready-card" aria-label="Order ready">
        <div className="ready-avatar-wrap">
          <img src={logo} alt="Coffee cup" className="ready-avatar" />
        </div>

        <small className="ready-kicker">{STATUS_TEXT}</small>
        <h1 className="ready-table">Table: {tableNumber}</h1>
        <div className="ready-divider" />
        <h2 className="ready-title">{THANK_YOU_TEXT}</h2>
        <p className="ready-message">{PICKUP_MESSAGE}</p>

        <button className="ready-primary-btn" type="button" onClick={onEnjoyCoffee}>
          Enjoy your coffee
        </button>
      </section>
    </main>
  );
}

export default Ready;
