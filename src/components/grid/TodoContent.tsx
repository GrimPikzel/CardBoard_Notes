import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface TodoContentProps {
  content: Record<string, unknown>;
  onUpdate: (data: Record<string, unknown>) => void;
}

const TodoContent: React.FC<TodoContentProps> = ({ content, onUpdate }) => {
  const items = (content?.items as TodoItem[]) || [];
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    const newItems = [...items, { id: Date.now().toString(), text: newItem, done: false }];
    onUpdate({ ...content, items: newItems });
    setNewItem('');
  };

  const toggleItem = (itemId: string) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdate({ ...content, items: newItems });
  };

  const deleteItem = (itemId: string) => {
    const newItems = items.filter((item) => item.id !== itemId);
    onUpdate({ ...content, items: newItems });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Input Area */}
      <div style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', gap: 8 }}>
        <input
          data-no-drag
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="New task..."
          style={{
            flex: 1,
            background: '#262626',
            border: '1px solid #333',
            borderRadius: 4,
            color: '#fff',
            padding: '4px 8px',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          data-no-drag
          onClick={handleAdd}
          style={{
            background: '#333',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            padding: '0 8px',
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* List Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {items.map((item) => (
          <div
            key={item.id}
            className="todo-item"
            style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8 }}
          >
            <button
              data-no-drag
              onClick={() => toggleItem(item.id)}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: item.done ? 'none' : '1px solid #555',
                background: item.done ? '#4ade80' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {item.done && <Check size={10} color="#000" />}
            </button>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: item.done ? '#737373' : '#e5e5e5',
                textDecoration: item.done ? 'line-through' : 'none',
                wordBreak: 'break-word',
              }}
            >
              {item.text}
            </span>
            <button
              data-no-drag
              onClick={() => deleteItem(item.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#525252',
                cursor: 'pointer',
                opacity: 0.5,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#525252')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoContent;
