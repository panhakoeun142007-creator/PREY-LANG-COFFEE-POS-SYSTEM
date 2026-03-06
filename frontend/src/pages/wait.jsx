import { useMemo } from "react";
import "../wait.css";

function Wait({ cartItems = [], onPickUpNow, onBackToMenu, onBack }) {
  const orderStatus = useMemo(() => {
    const expandedItems = cartItems.flatMap((item) => {
      const quantity = Number.isFinite(Number(item.quantity)) ? Math.max(0, Number(item.quantity)) : 0;
      return Array.from({ length: quantity }, () => ({
        name: item.name,
      }));
    });

    const withStatus = expandedItems.map((item, index) => {
      const cycleIndex = index % 3;
      const status = cycleIndex === 0 ? "ordered" : cycleIndex === 1 ? "preparing" : "ready";
      return { ...item, status };
    });

    const groupedByNameAndStatus = withStatus.reduce((map, item) => {
      const key = `${item.status}|${item.name}`;
      if (!map.has(key)) {
        map.set(key, { name: item.name, status: item.status, quantity: 0 });
      }
      map.get(key).quantity += 1;
      return map;
    }, new Map());

    const grouped = Array.from(groupedByNameAndStatus.values());
    const orderedItems = grouped.filter((item) => item.status === "ordered");
    const preparingItems = grouped.filter((item) => item.status === "preparing");
    const readyItems = grouped.filter((item) => item.status === "ready");

    return {
      orderedItems,
      preparingItems,
      readyItems,
      queue: {
        ordered: orderedItems.reduce((sum, item) => sum + item.quantity, 0),
        preparing: preparingItems.reduce((sum, item) => sum + item.quantity, 0),
        ready: readyItems.reduce((sum, item) => sum + item.quantity, 0),
      },
    };
  }, [cartItems]);

  const combinedProgressItems = [
    ...orderStatus.preparingItems,
    ...orderStatus.orderedItems,
  ];

  return (
    <div className="wait-page">
      <header className="wait-header">
        <div className="wait-header-left">
          <button className="wait-back-btn" type="button" onClick={onBack} aria-label="Back">
            {"<"}
          </button>
          <div className="wait-brand">
            <div className="wait-brand-icon">C</div>
            <div>
              <h3>prey Lang coffee</h3>
              <p>Table 012 - Guest</p>
            </div>
          </div>
        </div>
       
      </header>

      <h2 className="wait-title">My Order Status</h2>
      <p className="wait-subtitle">SHOP QUEUE STATUS</p>

      <section className="wait-queue-grid">
        <div className="wait-queue-card">
          <small>ORDERED</small>
          <strong>{String(orderStatus.queue.ordered).padStart(2, "0")}</strong>
        </div>
        <div className="wait-queue-card">
          <small>PREPARING</small>
          <strong>{String(orderStatus.queue.preparing).padStart(2, "0")}</strong>
        </div>
        <div className="wait-queue-card ready">
          <small>READY</small>
          <strong>{String(orderStatus.queue.ready).padStart(2, "0")}</strong>
        </div>
      </section>

      <div className="wait-order-row">
        <h4>Your Order</h4>
        <span>Est. 4-6 mins</span>
      </div>

      <section className="wait-ready-card">
        {orderStatus.readyItems.length > 0 ? (
          orderStatus.readyItems.map((item, index) => (
            <div className="wait-ready-item" key={`${item.name}-ready-${index}`}>
              <div className="wait-ready-icon">{item.quantity}</div>
              <div>
                <p>Table 012</p>
                <small>{item.name}</small>
              </div>
              <span>READY</span>
            </div>
          ))
        ) : (
          <div className="wait-ready-item">
            <div className="wait-ready-icon">0</div>
            <div>
              <p>Table 012</p>
              <small>No items ready yet</small>
            </div>
            <span>READY</span>
          </div>
        )}
        <button
          className="wait-pickup-btn"
          type="button"
          onClick={onPickUpNow ?? onBackToMenu}
        >
          PICK UP NOW
        </button>
      </section>

      <section className="wait-preparing-list">
        {combinedProgressItems.length > 0 ? (
          combinedProgressItems.map((item, index) => {
            const isPreparing = item.status === "preparing";
            return (
              <article key={`${item.name}-${item.status}-${index}`}>
                <div className="wait-preparing-left">
                  <div className="wait-preparing-icon">{item.quantity}</div>
                  <div>
                    <p>Table A-012</p>
                    <small>{item.name}</small>
                  </div>
                </div>
                <div className="wait-preparing-right">
                  <span>{isPreparing ? "~2 mins" : "~5 mins"}</span>
                  <small>{isPreparing ? "PREPARING" : "ORDERED"}</small>
                </div>
              </article>
            );
          })
        ) : (
          <article>
            <div className="wait-preparing-left">
              <div className="wait-preparing-icon">0</div>
              <div>
                <p>Table A-012</p>
                <small>No pending items</small>
              </div>
            </div>
            <div className="wait-preparing-right">
              <span>~0 mins</span>
              <small>ORDERED</small>
            </div>
          </article>
        )}
      </section>

      <footer className="wait-ticker">
        <p>
          YOUR ORDER IS READY AT THE PICKUP COUNTER! - JOIN OUR REWARDS PROGRAM FOR FREE COFFEE
        </p>
      </footer>
    </div>
  );
}

export default Wait;
