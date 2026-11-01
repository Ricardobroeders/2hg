"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";

/**
 * Rich-text editor for a deck's notes, stored as markdown.
 *
 * Markdown rather than editor JSON or HTML: it's what a deck primer looks like
 * everywhere else (Moxfield, Reddit, Discord), it pastes in and out cleanly,
 * and the share page renders it server-side without trusting stored HTML.
 *
 * Loaded only when the notes dialog opens — Tiptap and ProseMirror are most of
 * this component's weight and have no business in the builder's first load.
 */
export default function NotesEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (markdown: string) => void;
}) {
  // Store writes persist the whole builder to localStorage, so keystrokes are
  // batched rather than each serialising every deck and the card cache.
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  const editor = useEditor({
    // The builder is client-only, but Tiptap still guards against a server
    // render unless told there won't be one.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Only what markdown can express. Underline has no markdown syntax and
        // would be silently dropped on the next load.
        underline: false,
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({
        placeholder:
          "How does this deck win? What does it need from its partner? What should you mulligan for?",
      }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "notes-prose min-h-48 px-4 py-3 outline-none",
        "aria-label": "Deck notes",
      },
    },
    onUpdate: ({ editor }) => {
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(() => {
        pending.current = null;
        latest.current(editor.getMarkdown());
      }, 300);
    },
  });

  // Closing the dialog mid-sentence must not lose the last few keystrokes.
  useEffect(() => {
    return () => {
      if (pending.current && editor) {
        clearTimeout(pending.current);
        latest.current(editor.getMarkdown());
      }
    };
  }, [editor]);

  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            strike: editor.isActive("strike"),
            heading: editor.isActive("heading"),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            blockquote: editor.isActive("blockquote"),
          }
        : null,
  });

  if (!editor) {
    return (
      <div className="h-60 rounded-xl border border-white/15 bg-white/[0.03]" />
    );
  }

  const tools = [
    {
      label: "Bold",
      glyph: <strong>B</strong>,
      on: active?.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      glyph: <em className="font-serif">I</em>,
      on: active?.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Strikethrough",
      glyph: <s>S</s>,
      on: active?.strike,
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Heading",
      glyph: "H",
      on: active?.heading,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bulleted list",
      glyph: "•",
      on: active?.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      glyph: "1.",
      on: active?.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      glyph: "“",
      on: active?.blockquote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.03] focus-within:border-emerald-400/50">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap gap-1 border-b border-white/10 p-1.5"
      >
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            aria-pressed={Boolean(t.on)}
            // Keep the selection: a mousedown on the button would otherwise
            // blur the editor before the command runs.
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className={`grid h-7 min-w-7 place-items-center rounded px-1.5 text-xs transition ${
              t.on
                ? "bg-emerald-400/15 text-emerald-300"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t.glyph}
          </button>
        ))}
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
