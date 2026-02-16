import React, { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';

interface ImageContentProps {
  content: Record<string, unknown>;
  onUpdate: (data: Record<string, unknown>) => void;
}

const ImageContent: React.FC<ImageContentProps> = ({ content, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...content, src: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (content?.src) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
        }}
      >
        <img
          src={content.src as string}
          alt="Upload"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
        <button
          data-no-drag
          onClick={() => onUpdate({ ...content, src: null })}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            padding: 4,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: '#525252',
        cursor: 'pointer',
        border: '2px dashed #333',
        borderRadius: 8,
        margin: 8,
        width: 'calc(100% - 16px)',
        height: 'calc(100% - 16px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#525252';
        e.currentTarget.style.color = '#737373';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#333';
        e.currentTarget.style.color = '#525252';
      }}
    >
      <input
        data-no-drag
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <Upload size={32} />
      <span style={{ fontSize: 13 }}>Click to Upload Image</span>
    </div>
  );
};

export default ImageContent;
