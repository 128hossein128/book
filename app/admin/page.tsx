"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Book, BookCategory } from "@/lib/types";

function categoryFa(value: BookCategory) {
  return value === "basij" ? "بسیج" : "عمومی";
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<BookCategory>("public");
  const [draggedId, setDraggedId] = useState<number | null>(null);

  async function loadBooks() {
    const res = await fetch("/api/admin/books", { cache: "no-store" });
    if (res.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در دریافت اطلاعات");
    setBooks(data);
    setAuthenticated(true);
  }

  useEffect(() => {
    loadBooks().catch((e) => {
      setMessage(e.message);
      setAuthenticated(false);
    });
  }, []);

  const active = useMemo(
    () => books.filter((b) => !b.is_deleted).sort((a, b) => a.position - b.position),
    [books]
  );
  const deleted = useMemo(() => books.filter((b) => b.is_deleted), [books]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ورود ناموفق بود");
      setPassword("");
      await loadBooks();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setBooks([]);
    setAuthenticated(false);
  }

  async function addBook(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, category: newCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "افزودن ناموفق بود");
      setNewTitle("");
      setNewCategory("public");
      await loadBooks();
      setMessage("کتاب جدید اضافه شد.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function updateBook(id: number, title: string, category: BookCategory) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ذخیره ناموفق بود");
      await loadBooks();
      setMessage("تغییرات ذخیره شد.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function removeBook(book: Book) {
    if (!window.confirm(`«${book.title}» حذف شود؟ امکان بازیابی وجود دارد.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/books/${book.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حذف ناموفق بود");
      await loadBooks();
      setMessage("کتاب به بخش حذف‌شده‌ها منتقل شد.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function restoreBook(book: Book) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "بازیابی ناموفق بود");
      await loadBooks();
      setMessage("کتاب بازیابی شد و به انتهای فهرست رفت.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function saveOrder(next: Book[]) {
    setBooks((prev) => [...next, ...prev.filter((b) => b.is_deleted)]);
    const res = await fetch("/api/admin/books/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((b) => b.id) }),
    });
    const data = await res.json();
    if (!res.ok) {
      await loadBooks();
      throw new Error(data.error || "ذخیره ترتیب ناموفق بود");
    }
    await loadBooks();
  }

  async function move(id: number, direction: -1 | 1) {
    const index = active.findIndex((b) => b.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= active.length) return;
    const next = [...active];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await saveOrder(next);
      setMessage("ترتیب ذخیره شد.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    }
  }

  async function dropOn(targetId: number) {
    if (!draggedId || draggedId === targetId) return;
    const from = active.findIndex((b) => b.id === draggedId);
    const to = active.findIndex((b) => b.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...active];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggedId(null);
    try {
      await saveOrder(next);
      setMessage("ترتیب جدید ذخیره شد.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا");
    }
  }

  if (authenticated === null) {
    return <main className="shell"><section className="card">در حال بررسی دسترسی…</section></main>;
  }

  if (!authenticated) {
    return (
      <main className="shell narrow">
        <section className="card login-card">
          <a href="/" className="back-link">← بازگشت به صفحه عمومی</a>
          <h1>ورود مدیر</h1>
          <p className="muted">برای مدیریت کتاب‌ها رمز مدیر را وارد کنید.</p>
          <form onSubmit={login} className="stack">
            <label className="field">
              <span>رمز عبور</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </label>
            <button className="primary" disabled={busy}>{busy ? "در حال ورود…" : "ورود"}</button>
          </form>
          {message && <div className="notice error">{message}</div>}
        </section>
      </main>
    );
  }

  return (
    <main className="shell admin-shell">
      <section className="hero card">
        <div>
          <span className="eyebrow">پنل مدیریت</span>
          <h1>مدیریت کتاب‌ها</h1>
          <p className="muted">افزودن، ویرایش، حذف و جابه‌جایی ترتیب آثار</p>
        </div>
        <div className="top-actions">
          <a className="secondary" href="/">مشاهده سایت</a>
          <button className="danger-ghost" onClick={logout}>خروج</button>
        </div>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="card">
        <div className="section-head">
          <div><h2>افزودن کتاب جدید</h2><p className="muted">کتاب به انتهای فهرست اضافه می‌شود.</p></div>
        </div>
        <form className="add-grid" onSubmit={addBook}>
          <label className="field">
            <span>نام کتاب</span>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="نام کتاب جدید" />
          </label>
          <label className="field">
            <span>نوع</span>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as BookCategory)}>
              <option value="public">عمومی</option>
              <option value="basij">بسیج</option>
            </select>
          </label>
          <button className="primary align-end" disabled={busy || !newTitle.trim()}>افزودن</button>
        </form>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <h2>ترتیب آثار</h2>
            <p className="muted">با گرفتن ردیف و رها کردن، یا دکمه‌های بالا و پایین، ترتیب را تغییر دهید.</p>
          </div>
          <span className="count-pill">{active.length} کتاب</span>
        </div>

        <div className="admin-list">
          {active.map((book, index) => (
            <EditableBookRow
              key={book.id}
              book={book}
              index={index}
              total={active.length}
              busy={busy}
              onSave={updateBook}
              onDelete={removeBook}
              onMove={move}
              onDragStart={() => setDraggedId(book.id)}
              onDrop={() => dropOn(book.id)}
            />
          ))}
        </div>
      </section>

      <section className="card deleted-card">
        <div className="section-head">
          <div><h2>حذف‌شده‌ها</h2><p className="muted">در صورت نیاز می‌توانید کتاب حذف‌شده را بازیابی کنید.</p></div>
          <span className="count-pill">{deleted.length}</span>
        </div>
        {deleted.length === 0 ? (
          <div className="empty">کتاب حذف‌شده‌ای وجود ندارد.</div>
        ) : (
          <div className="admin-list">
            {deleted.map((book) => (
              <div className="deleted-row" key={book.id}>
                <div><strong>{book.title}</strong><small>{categoryFa(book.category)}</small></div>
                <button className="secondary" disabled={busy} onClick={() => restoreBook(book)}>بازیابی</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EditableBookRow({
  book, index, total, busy, onSave, onDelete, onMove, onDragStart, onDrop,
}: {
  book: Book;
  index: number;
  total: number;
  busy: boolean;
  onSave: (id: number, title: string, category: BookCategory) => Promise<void>;
  onDelete: (book: Book) => Promise<void>;
  onMove: (id: number, direction: -1 | 1) => Promise<void>;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  const [title, setTitle] = useState(book.title);
  const [category, setCategory] = useState<BookCategory>(book.category);

  return (
    <div
      className="admin-row"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <span className="drag" title="برای جابه‌جایی بکشید">⋮⋮</span>
      <span className="position">{index + 1}</span>
      <input className="inline-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <select className="inline-category" value={category} onChange={(e) => setCategory(e.target.value as BookCategory)}>
        <option value="public">عمومی</option>
        <option value="basij">بسیج</option>
      </select>
      <div className="row-actions">
        <button className="icon-btn" title="بالاتر" disabled={busy || index === 0} onClick={() => onMove(book.id, -1)}>↑</button>
        <button className="icon-btn" title="پایین‌تر" disabled={busy || index === total - 1} onClick={() => onMove(book.id, 1)}>↓</button>
        <button className="save-btn" disabled={busy || !title.trim()} onClick={() => onSave(book.id, title, category)}>ذخیره</button>
        <button className="delete-btn" disabled={busy} onClick={() => onDelete(book)}>حذف</button>
      </div>
    </div>
  );
}
