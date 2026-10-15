import { useState, useEffect } from 'react';
import type { FC, KeyboardEvent, MouseEvent } from 'react';
import { BookEntry } from '@planner/shared';
import { Check, X, BookmarkCheck } from 'lucide-react';

interface BookshelfProps {
  books: BookEntry[];
  onChange: (books: BookEntry[]) => void;
  maxBooks?: number;
}

const PALETTE = [
  { name: 'Sage Green', hex: '#7A9A48' },
  { name: 'Deep Olive', hex: '#6E8B3D' },
  { name: 'Warm Terracotta', hex: '#C85A48' },
  { name: 'Slate Charcoal', hex: '#2F3E46' },
  { name: 'Warm Ochre', hex: '#D4A373' },
];

export const Bookshelf: FC<BookshelfProps> = ({
  books,
  onChange,
  maxBooks = 5,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editColor, setEditColor] = useState(PALETTE[0].hex);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && editingIndex !== null) {
        setEditingIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingIndex]);

  // Ensure 5 slots
  const slots: (BookEntry | null)[] = Array.from({ length: maxBooks }).map(
    (_, i) => books[i] || null
  );

  const startEdit = (index: number) => {
    const existing = slots[index];
    setEditingIndex(index);
    setEditTitle(existing ? existing.title : '');
    setEditAuthor(existing?.author || '');
    setEditColor(existing?.colorHex || PALETTE[index % PALETTE.length].hex);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const newBooks = [...books];
    const existing = newBooks[editingIndex];

    if (!editTitle.trim() && !existing) {
      setEditingIndex(null);
      return;
    }

    const updatedBook: BookEntry = {
      id: existing ? existing.id : crypto.randomUUID(),
      title: editTitle.trim() || 'Untitled Book',
      author: editAuthor.trim() || undefined,
      colorHex: editColor,
      read: existing ? existing.read : false,
    };

    if (editingIndex < newBooks.length) {
      newBooks[editingIndex] = updatedBook;
    } else {
      newBooks.push(updatedBook);
    }

    onChange(newBooks);
    setEditingIndex(null);
  };

  const toggleRead = (index: number, e?: MouseEvent | KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (!slots[index]) return;
    const newBooks = [...books];
    newBooks[index] = {
      ...newBooks[index],
      read: !newBooks[index].read,
    };
    onChange(newBooks);
  };

  const removeBook = (index: number, e?: MouseEvent | KeyboardEvent) => {
    if (e) e.stopPropagation();
    const newBooks = books.filter((_, i) => i !== index);
    onChange(newBooks);
    setEditingIndex(null);
  };

  const handleSlotKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startEdit(index);
    }
  };

  return (
    <section aria-label="Books to Read Shelf" className="w-full flex flex-col items-center">
      {/* Bookshelf Illustration matching Reference Image Screenshot 122649.png */}
      <div className="relative w-full max-w-xs h-36 flex items-end justify-center px-4">
        <svg
          className="w-full h-full"
          viewBox="0 0 240 140"
          fill="none"
          role="img"
          aria-label="Interactive 5-book bookshelf spread"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS FOR GRADIENTS & EMBOSS */}
          <defs>
            <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D061" />
              <stop offset="100%" stopColor="#C8961E" />
            </linearGradient>
            <linearGradient id="bookHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* BOOK 1 (Leftmost, tall spine with 4 gold/ink ribs) */}
          <g
            className="cursor-pointer group focus:outline-none"
            onClick={() => startEdit(0)}
            onKeyDown={(e) => handleSlotKeyDown(0, e)}
            role="button"
            tabIndex={0}
            aria-label={
              slots[0]
                ? `Slot 1, Book: ${slots[0].title}${slots[0].author ? ' by ' + slots[0].author : ''}${
                    slots[0].read ? ', Completed' : ', Reading'
                  }. Press Enter to edit.`
                : 'Empty book slot 1. Press Enter to add a book.'
            }
          >
            <rect
              x="25"
              y="20"
              width="24"
              height="95"
              rx="1.5"
              stroke="#1A1A1A"
              strokeWidth="2"
              fill={slots[0]?.colorHex || '#FDFBF7'}
              className="transition-all group-hover:stroke-stone-600 group-focus-visible:stroke-sage-dark group-focus-visible:stroke-[3px]"
            />
            {/* Texture highlight */}
            <rect x="25" y="20" width="24" height="95" rx="1.5" fill="url(#bookHighlight)" pointerEvents="none" />
            {/* Spine ribs */}
            <line x1="25" y1="36" x2="49" y2="36" stroke={slots[0]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            <line x1="25" y1="52" x2="49" y2="52" stroke={slots[0]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            <line x1="25" y1="78" x2="49" y2="78" stroke={slots[0]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            <line x1="25" y1="94" x2="49" y2="94" stroke={slots[0]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            {/* Satisfying Completed Ribbon Bookmark */}
            {slots[0]?.read && (
              <path
                d="M 33 16 L 39 16 L 39 28 L 36 25 L 33 28 Z"
                fill="url(#goldRibbon)"
                stroke="#B8860B"
                strokeWidth="0.75"
              />
            )}
            {slots[0]?.title && (
              <text
                x="37"
                y="65"
                transform="rotate(-90 37 65)"
                textAnchor="middle"
                fontSize="7"
                fontFamily="Cinzel, Georgia, serif"
                fill={slots[0].read ? '#FFFFFF' : '#1A1A1A'}
                className="font-medium select-none pointer-events-none"
              >
                {slots[0].title.length > 14 ? slots[0].title.slice(0, 13) + '…' : slots[0].title}
              </text>
            )}
          </g>

          {/* BOOK 2 (Slightly shorter, olive, dual gold bands) */}
          <g
            className="cursor-pointer group focus:outline-none"
            onClick={() => startEdit(1)}
            onKeyDown={(e) => handleSlotKeyDown(1, e)}
            role="button"
            tabIndex={0}
            aria-label={
              slots[1]
                ? `Slot 2, Book: ${slots[1].title}${slots[1].author ? ' by ' + slots[1].author : ''}${
                    slots[1].read ? ', Completed' : ', Reading'
                  }. Press Enter to edit.`
                : 'Empty book slot 2. Press Enter to add a book.'
            }
          >
            <rect
              x="53"
              y="28"
              width="22"
              height="87"
              rx="1.5"
              stroke="#1A1A1A"
              strokeWidth="2"
              fill={slots[1]?.colorHex || '#FDFBF7'}
              className="transition-all group-hover:stroke-stone-600 group-focus-visible:stroke-sage-dark group-focus-visible:stroke-[3px]"
            />
            <rect x="53" y="28" width="22" height="87" rx="1.5" fill="url(#bookHighlight)" pointerEvents="none" />
            <line x1="53" y1="42" x2="75" y2="42" stroke={slots[1]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            <line x1="53" y1="84" x2="75" y2="84" stroke={slots[1]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            {slots[1]?.read && (
              <path
                d="M 60 24 L 66 24 L 66 36 L 63 33 L 60 36 Z"
                fill="url(#goldRibbon)"
                stroke="#B8860B"
                strokeWidth="0.75"
              />
            )}
            {slots[1]?.title && (
              <text
                x="64"
                y="63"
                transform="rotate(-90 64 63)"
                textAnchor="middle"
                fontSize="7"
                fontFamily="Cinzel, Georgia, serif"
                fill={slots[1].read ? '#FFFFFF' : '#1A1A1A'}
                className="font-medium select-none pointer-events-none"
              >
                {slots[1].title.length > 12 ? slots[1].title.slice(0, 11) + '…' : slots[1].title}
              </text>
            )}
          </g>

          {/* BOOK 3 (Medium book, central, terracotta) */}
          <g
            className="cursor-pointer group focus:outline-none"
            onClick={() => startEdit(2)}
            onKeyDown={(e) => handleSlotKeyDown(2, e)}
            role="button"
            tabIndex={0}
            aria-label={
              slots[2]
                ? `Slot 3, Book: ${slots[2].title}${slots[2].author ? ' by ' + slots[2].author : ''}${
                    slots[2].read ? ', Completed' : ', Reading'
                  }. Press Enter to edit.`
                : 'Empty book slot 3. Press Enter to add a book.'
            }
          >
            <rect
              x="79"
              y="34"
              width="22"
              height="81"
              rx="1.5"
              stroke="#1A1A1A"
              strokeWidth="2"
              fill={slots[2]?.colorHex || '#FDFBF7'}
              className="transition-all group-hover:stroke-stone-600 group-focus-visible:stroke-sage-dark group-focus-visible:stroke-[3px]"
            />
            <rect x="79" y="34" width="22" height="81" rx="1.5" fill="url(#bookHighlight)" pointerEvents="none" />
            <line x1="79" y1="48" x2="101" y2="48" stroke={slots[2]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            <line x1="79" y1="90" x2="101" y2="90" stroke={slots[2]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            {slots[2]?.read && (
              <path
                d="M 86 30 L 92 30 L 92 42 L 89 39 L 86 42 Z"
                fill="url(#goldRibbon)"
                stroke="#B8860B"
                strokeWidth="0.75"
              />
            )}
            {slots[2]?.title && (
              <text
                x="90"
                y="69"
                transform="rotate(-90 90 69)"
                textAnchor="middle"
                fontSize="7"
                fontFamily="Cinzel, Georgia, serif"
                fill={slots[2].read ? '#FFFFFF' : '#1A1A1A'}
                className="font-medium select-none pointer-events-none"
              >
                {slots[2].title.length > 12 ? slots[2].title.slice(0, 11) + '…' : slots[2].title}
              </text>
            )}
          </g>

          {/* BOOK 4 (Crown book, slate charcoal) */}
          <g
            className="cursor-pointer group focus:outline-none"
            onClick={() => startEdit(3)}
            onKeyDown={(e) => handleSlotKeyDown(3, e)}
            role="button"
            tabIndex={0}
            aria-label={
              slots[3]
                ? `Slot 4, Book: ${slots[3].title}${slots[3].author ? ' by ' + slots[3].author : ''}${
                    slots[3].read ? ', Completed' : ', Reading'
                  }. Press Enter to edit.`
                : 'Empty book slot 4. Press Enter to add a book.'
            }
          >
            <rect
              x="105"
              y="40"
              width="28"
              height="75"
              rx="2"
              stroke="#1A1A1A"
              strokeWidth="2"
              fill={slots[3]?.colorHex || '#FDFBF7'}
              className="transition-all group-hover:stroke-stone-600 group-focus-visible:stroke-sage-dark group-focus-visible:stroke-[3px]"
            />
            <rect x="105" y="40" width="28" height="75" rx="2" fill="url(#bookHighlight)" pointerEvents="none" />
            <line x1="105" y1="52" x2="133" y2="52" stroke={slots[3]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            <line x1="105" y1="98" x2="133" y2="98" stroke={slots[3]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            {slots[3]?.read && (
              <path
                d="M 115 36 L 121 36 L 121 48 L 118 45 L 115 48 Z"
                fill="url(#goldRibbon)"
                stroke="#B8860B"
                strokeWidth="0.75"
              />
            )}
            {slots[3]?.title && (
              <text
                x="119"
                y="75"
                transform="rotate(-90 119 75)"
                textAnchor="middle"
                fontSize="7"
                fontFamily="Cinzel, Georgia, serif"
                fill={slots[3].read ? '#FFFFFF' : '#1A1A1A'}
                className="font-medium select-none pointer-events-none"
              >
                {slots[3].title.length > 14 ? slots[3].title.slice(0, 13) + '…' : slots[3].title}
              </text>
            )}
          </g>

          {/* BOOK 5 (Leaning book to the right - matching reference drawing!) */}
          <g
            className="cursor-pointer group focus:outline-none"
            onClick={() => startEdit(4)}
            onKeyDown={(e) => handleSlotKeyDown(4, e)}
            role="button"
            tabIndex={0}
            transform="rotate(16 145 115)"
            aria-label={
              slots[4]
                ? `Slot 5, Book: ${slots[4].title}${slots[4].author ? ' by ' + slots[4].author : ''}${
                    slots[4].read ? ', Completed' : ', Reading'
                  }. Press Enter to edit.`
                : 'Empty book slot 5. Press Enter to add a book.'
            }
          >
            <rect
              x="138"
              y="38"
              width="22"
              height="77"
              rx="1.5"
              stroke="#1A1A1A"
              strokeWidth="2"
              fill={slots[4]?.colorHex || '#FDFBF7'}
              className="transition-all group-hover:stroke-stone-600 group-focus-visible:stroke-sage-dark group-focus-visible:stroke-[3px]"
            />
            <rect x="138" y="38" width="22" height="77" rx="1.5" fill="url(#bookHighlight)" pointerEvents="none" />
            <line x1="138" y1="50" x2="160" y2="50" stroke={slots[4]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            <line x1="138" y1="96" x2="160" y2="96" stroke={slots[4]?.read ? '#E5A93C' : '#1A1A1A'} strokeWidth="1.5" />
            {slots[4]?.read && (
              <path
                d="M 145 34 L 151 34 L 151 46 L 148 43 L 145 46 Z"
                fill="url(#goldRibbon)"
                stroke="#B8860B"
                strokeWidth="0.75"
              />
            )}
            {slots[4]?.title && (
              <text
                x="149"
                y="73"
                transform="rotate(-90 149 73)"
                textAnchor="middle"
                fontSize="7"
                fontFamily="Cinzel, Georgia, serif"
                fill={slots[4].read ? '#FFFFFF' : '#1A1A1A'}
                className="font-medium select-none pointer-events-none"
              >
                {slots[4].title.length > 12 ? slots[4].title.slice(0, 11) + '…' : slots[4].title}
              </text>
            )}
          </g>

          {/* SHELF (Horizontal plank) */}
          <rect
            x="15"
            y="115"
            width="200"
            height="4"
            fill="#1A1A1A"
            stroke="#1A1A1A"
            strokeWidth="1"
          />

          {/* SHELF LEGS (Two triangular legs pointing down - matching screenshot) */}
          <polygon points="30,119 36,119 33,132" fill="#1A1A1A" />
          <polygon points="194,119 200,119 197,132" fill="#1A1A1A" />
        </svg>
      </div>

      {/* Book list / quick status below */}
      <div className="w-full mt-3 space-y-1.5" role="list" aria-label="Bookshelf listing">
        {slots.map((book, idx) => (
          <div
            key={idx}
            role="listitem"
            className="group flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg hover:bg-paper-muted border border-transparent hover:border-border-subtle/80 transition-colors"
          >
            <button
              type="button"
              onClick={() => startEdit(idx)}
              className="flex items-center gap-2 overflow-hidden text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-sage rounded"
              aria-label={
                book
                  ? `Edit book ${idx + 1}: ${book.title}${book.read ? ' (Completed)' : ''}`
                  : `Add book to slot ${idx + 1}`
              }
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-2xs"
                style={{ backgroundColor: book ? book.colorHex : '#D3CEB6' }}
              />
              <span className={`font-serif truncate ${book ? 'text-ink font-medium' : 'text-stone-400 italic'}`}>
                {book ? book.title : `Slot ${idx + 1}: Empty (click to add)`}
              </span>
            </button>

            {book && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => toggleRead(idx, e)}
                  aria-label={book.read ? `Mark "${book.title}" as unread` : `Mark "${book.title}" as completed`}
                  title={book.read ? 'Mark as unread' : 'Mark as read'}
                  className={`p-1 rounded cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                    book.read
                      ? 'bg-sage-surface text-sage border border-sage/30'
                      : 'text-stone-400 hover:text-ink'
                  }`}
                >
                  {book.read ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => removeBook(idx, e)}
                  aria-label={`Remove "${book.title}" from bookshelf`}
                  title="Remove book"
                  className="p-1 text-stone-400 hover:text-terracotta rounded cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Accessible Edit Book Modal Dialog */}
      {editingIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bookshelf-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 motion-reduce:transition-none"
        >
          <div className="bg-paper border border-border-subtle rounded-xl shadow-paper-lg p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h4 id="bookshelf-dialog-title" className="font-serif font-semibold text-ink text-base">
                {slots[editingIndex] ? 'Edit Book' : 'Add Book to Shelf'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                aria-label="Close dialog"
                className="text-stone-400 hover:text-ink rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="book-title-input"
                  className="block text-xs font-serif uppercase tracking-wider text-ink-muted mb-1"
                >
                  Book Title
                </label>
                <input
                  id="book-title-input"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveEdit();
                    }
                  }}
                  placeholder="e.g. The Psychology of Money"
                  autoFocus
                  className="w-full bg-paper-alt border border-border-subtle rounded-lg px-3 py-1.5 text-sm font-serif text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                />
              </div>

              <div>
                <label
                  htmlFor="book-author-input"
                  className="block text-xs font-serif uppercase tracking-wider text-ink-muted mb-1"
                >
                  Author (Optional)
                </label>
                <input
                  id="book-author-input"
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveEdit();
                    }
                  }}
                  placeholder="e.g. Morgan Housel"
                  className="w-full bg-paper-alt border border-border-subtle rounded-lg px-3 py-1.5 text-sm font-serif text-ink focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                />
              </div>

              <div>
                <span className="block text-xs font-serif uppercase tracking-wider text-ink-muted mb-1">
                  Spine Color & Leather Finish
                </span>
                <div className="flex items-center gap-2" role="radiogroup" aria-label="Spine color options">
                  {PALETTE.map(({ name, hex }) => (
                    <button
                      key={hex}
                      type="button"
                      role="radio"
                      aria-checked={editColor === hex}
                      aria-label={name}
                      onClick={() => setEditColor(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                        editColor === hex
                          ? 'border-ink scale-110 shadow-xs'
                          : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="px-3 py-1.5 text-xs font-serif text-ink-muted hover:text-ink rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-1.5 text-xs font-serif font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer shadow-xs"
              >
                Save Book
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
