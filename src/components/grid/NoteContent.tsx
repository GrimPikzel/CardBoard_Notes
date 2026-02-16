import React from 'react';

interface NoteContentProps {
  content: Record<string, unknown>;
  onUpdate: (data: Record<string, unknown>) => void;
}

const NoteContent: React.FC<NoteContentProps> = ({ content, onUpdate }) => {
  return (
    <textarea
      data-no-drag
      className="nodrag"
      value={(content?.text as string) || ''}
      onChange={(e) => onUpdate({ ...content, text: e.target.value })}
      placeholder="Start typing..."
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        border: 'none',
        resize: 'none',
        color: '#e5e5e5',
        fontSize: '14px',
        lineHeight: '1.5',
        padding: '16px',
        outline: 'none',
        fontFamily: 'inherit',
      }}
      onKeyDown={(e) => e.stopPropagation()}
    />
  );
};

export default NoteContent;
