import { useRef, useState, type KeyboardEvent } from "react";

const MAX_MESSAGE_LENGTH = 2000;
const TYPING_DEBOUNCE_MS = 2000;

interface MessageInputProps {
  placeholder: string;
  onSend: (body: string) => Promise<void>;
  onTyping: () => void;
}

export default function MessageInput({
  placeholder,
  onSend,
  onTyping,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const lastTypingSentRef = useRef(0);

  function handleChange(next: string) {
    setValue(next);
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_DEBOUNCE_MS) {
      lastTypingSentRef.current = now;
      onTyping();
    }
  }

  async function handleSend() {
    const body = value.trim();
    if (!body || body.length > MAX_MESSAGE_LENGTH) return;
    setValue("");
    await onSend(body);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const overLimit = value.length > MAX_MESSAGE_LENGTH;

  return (
    <div className="flex-shrink-0 bg-panel px-4 pb-4">
      <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2">
        <button
          type="button"
          title="Add attachment"
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
        >
          ⊕
        </button>
        <textarea
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-40 flex-1 resize-none bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="button"
          title="Image"
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
        >
          🖼
        </button>
        <button
          type="button"
          title="Emoji"
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
        >
          🙂
        </button>
        <button
          type="button"
          title="Mention"
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
        >
          @
        </button>
        <button
          onClick={() => void handleSend()}
          title="Send"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
        >
          ➤
        </button>
      </div>
      {overLimit && (
        <p className="mt-1 text-xs text-red-500">
          Message exceeds the {MAX_MESSAGE_LENGTH}-character limit (
          {value.length}/{MAX_MESSAGE_LENGTH}).
        </p>
      )}
    </div>
  );
}
