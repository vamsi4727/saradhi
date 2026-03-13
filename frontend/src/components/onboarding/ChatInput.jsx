import { useState } from 'react';

export default function ChatInput({ onSend, disabled, placeholder = 'Type here...' }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-xl border border-border px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-3 rounded-xl font-sans font-medium disabled:opacity-50 transition-colors duration-150"
      >
        Send
      </button>
    </form>
  );
}
