"use client";

import { useEffect, useMemo, useState } from "react";
import type { Book } from "@/lib/types";

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [includeBasij, setIncludeBasij] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/books", { cache: "no-store" });
        if (!res.ok) throw new Error("دریافت فهرست کتاب‌ها ناموفق بود.");
        const data: Book[] = await res.json();
        setBooks(data);
        if (data.length) setSelectedId(data[data.length - 1].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطایی رخ داد.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = useMemo(
    () => books.find((book) => book.id === selectedId),
    [books, selectedId]
  );

  const output = useMemo(() => {
    if (!current) return [];
    return books.filter(
      (book) =>
        book.position < current.position &&
        (includeBasij || book.category === "public")
    );
  }, [books, current, includeBasij]);

  const outputText = useMemo(
    () => output.map((book, i) => `${i + 1}. ${book.title}`).join("\n"),
    [output]
  );

  async function copyOutput() {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="shell">
      <section className="hero card">
        <div>
          <span className="eyebrow">سامانه معرفی آثار</span>
          <h1>سایر آثار نویسنده</h1>
          <p className="muted">کتاب فعلی را انتخاب کنید تا آثار پیش از آن به ترتیب آماده شوند.</p>
        </div>
        <a className="admin-link" href="/admin">ورود مدیر</a>
      </section>

      <section className="controls card">
        <label className="field">
          <span>کتاب فعلی</span>
          <select
            value={selectedId}
            disabled={loading || !books.length}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>{book.title}</option>
            ))}
          </select>
        </label>

        <label className="switch-row">
          <span>
            <strong>نمایش آثار بسیج</strong>
            <small>اگر خاموش باشد فقط آثار عمومی نمایش داده می‌شوند.</small>
          </span>
          <input
            aria-label="نمایش آثار بسیج"
            type="checkbox"
            checked={includeBasij}
            onChange={(e) => setIncludeBasij(e.target.checked)}
          />
        </label>
      </section>

      {error && <div className="notice error">{error}</div>}

      <section className="card output-card">
        <div className="section-head">
          <div>
            <h2>فهرست آماده</h2>
            <p className="muted">{loading ? "در حال دریافت..." : `${output.length} عنوان برای معرفی`}</p>
          </div>
          <button className="primary" onClick={copyOutput} disabled={!output.length}>
            {copied ? "کپی شد ✓" : "کپی فهرست"}
          </button>
        </div>

        <div className="book-list" aria-live="polite">
          {!loading && output.length === 0 && (
            <div className="empty">برای این انتخاب، اثر قبلی قابل نمایش وجود ندارد.</div>
          )}
          {output.map((book, index) => (
            <div className="book-row" key={book.id}>
              <span className="number">{index + 1}</span>
              <span className="book-title">{book.title}</span>
              {book.category === "basij" && <span className="badge">بسیج</span>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
