import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <span className="brand">PAPI</span>
      <h1>Bu sayfa radarımızda değil.</h1>
      <Link className="button primary" href="/feed">
        Akışa dön
      </Link>
    </main>
  );
}
