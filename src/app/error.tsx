"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty">
      <h1>Bir şeyler ters gitti.</h1>
      <p>Tekrar deneyebilirsin. Yerel verilerin korunur.</p>
      <button className="button primary" onClick={reset}>
        Tekrar dene
      </button>
    </main>
  );
}
