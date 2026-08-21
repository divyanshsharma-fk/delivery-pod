import { useRef, useEffect, useState, useCallback } from 'react';

export default function SignaturePad({ onConfirm }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Fill white background so PNG export is clean
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const start = useCallback((e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setHasSignature(true);
    setConfirmed(false);
    onConfirm(null); // reset confirmation on new stroke
  }, [onConfirm]);

  const move = useCallback((e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, []);

  const stop = useCallback(() => { drawing.current = false; }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setConfirmed(false);
    onConfirm(null);
  };

  const confirm = () => {
    const dataURL = canvasRef.current.toDataURL('image/png');
    setConfirmed(true);
    onConfirm(dataURL);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        style={{
          width: '100%',
          height: 140,
          border: confirmed ? '2px solid var(--success)' : '2px dashed #bbb',
          borderRadius: 8,
          touchAction: 'none',
          display: 'block',
          background: '#fff',
        }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={clear}
          style={{ flex: 1 }}
        >
          Clear
        </button>
        <button
          type="button"
          className={`btn btn-sm ${confirmed ? 'btn-success' : 'btn-primary'}`}
          onClick={confirm}
          disabled={!hasSignature}
          style={{ flex: 2 }}
        >
          {confirmed ? '✓ Signature Saved' : 'Confirm Signature'}
        </button>
      </div>
      {!hasSignature && (
        <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 6, textAlign: 'center' }}>
          Ask the receiver to sign above
        </p>
      )}
    </div>
  );
}
