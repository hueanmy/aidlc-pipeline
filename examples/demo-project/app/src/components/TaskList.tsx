import { useState } from 'react';
import { storage } from '../storage';
import type { Card, Column, NotificationKind } from '../types';

const TITLE_MAX = 200;

interface Props {
  onNotify: (kind: NotificationKind, title: string, body: string) => void;
}

export function TaskList({ onNotify }: Props) {
  const [columns] = useState<Column[]>(storage.getColumns());
  const [cards, setCards] = useState<Card[]>(storage.getCards());
  const [draftTitle, setDraftTitle] = useState('');
  const [draftColumn, setDraftColumn] = useState<string>(columns[0]?.id ?? 'todo');

  function persist(next: Card[]) {
    setCards(next);
    storage.setCards(next);
  }

  function nextPosition(columnId: string): number {
    const inCol = cards.filter((c) => c.columnId === columnId && !c.archivedAt);
    if (inCol.length === 0) return 1;
    return Math.max(...inCol.map((c) => c.position)) + 1;
  }

  function addCard() {
    const title = draftTitle.trim();
    if (title.length === 0 || title.length > TITLE_MAX) return;
    const next: Card = {
      id: 'c-' + Math.random().toString(36).slice(2, 10),
      title,
      columnId: draftColumn,
      position: nextPosition(draftColumn),
      assigneeIds: [],
      createdAt: new Date().toISOString(),
    };
    persist([...cards, next]);
    setDraftTitle('');
    onNotify('card.assigned', 'Card created', `"${next.title}" added to ${columnLabel(draftColumn)}.`);
  }

  function move(cardId: string, columnId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    persist(
      cards.map((c) =>
        c.id === cardId ? { ...c, columnId, position: nextPosition(columnId) } : c,
      ),
    );
    onNotify('card.assigned', 'Card moved', `"${card.title}" → ${columnLabel(columnId)}`);
  }

  function archive(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    persist(cards.map((c) => (c.id === cardId ? { ...c, archivedAt: new Date().toISOString() } : c)));
    onNotify('comment.replied', 'Card archived', `"${card.title}" archived. Reversible — see core-business/02-tasks.md.`);
  }

  function columnLabel(id: string): string {
    return columns.find((c) => c.id === id)?.name ?? id;
  }

  return (
    <section className="board">
      <header className="board-header">
        <h2>My Board</h2>
        <div className="composer">
          <input
            type="text"
            placeholder={`New task title (1–${TITLE_MAX} chars)`}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            maxLength={TITLE_MAX}
          />
          <select value={draftColumn} onChange={(e) => setDraftColumn(e.target.value)}>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button onClick={addCard} disabled={draftTitle.trim().length === 0}>
            Add
          </button>
        </div>
      </header>
      <div className="columns">
        {columns.map((col) => {
          const inCol = cards
            .filter((c) => c.columnId === col.id && !c.archivedAt)
            .sort((a, b) => a.position - b.position);
          return (
            <div key={col.id} className="column">
              <h3>
                {col.name} <span className="muted small">({inCol.length})</span>
              </h3>
              {inCol.length === 0 ? (
                <p className="muted small empty">No cards yet.</p>
              ) : (
                <ul>
                  {inCol.map((c) => (
                    <li key={c.id} className="card">
                      <div className="card-title">{c.title}</div>
                      <div className="card-actions">
                        {columns
                          .filter((other) => other.id !== col.id)
                          .map((other) => (
                            <button key={other.id} onClick={() => move(c.id, other.id)}>
                              → {other.name}
                            </button>
                          ))}
                        <button className="archive" onClick={() => archive(c.id)}>
                          Archive
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
