import { useState, useRef, useEffect } from 'react';
import { submitPOD, compressImage, stripBase64Prefix, todayDate } from '../api';
import SignaturePad from './SignaturePad';

export default function PODSubmission({ driver, point, assignment, onDone }) {
  const [deliveredBoxes, setDeliveredBoxes] = useState(assignment?.assigned_boxes || '');
  const [photoDataURL, setPhotoDataURL] = useState(null);
  const [signatureDataURL, setSignatureDataURL] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);

  // Auto-grab GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsError('Could not get location — please enable GPS'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Attach stream to video element when camera activates
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [stream]);

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      setStream(s);
      setCameraActive(true);
    } catch {
      alert('Camera access denied. Please allow camera access in your browser settings.');
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const raw = canvas.toDataURL('image/jpeg', 0.9);
    const compressed = await compressImage(raw, 1024, 0.75);
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraActive(false);
    setPhotoDataURL(compressed);
  };

  const retakePhoto = () => {
    setPhotoDataURL(null);
    openCamera();
  };

  const canSubmit =
    deliveredBoxes !== '' &&
    parseInt(deliveredBoxes) >= 0 &&
    photoDataURL &&
    signatureDataURL &&
    gps &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await submitPOD({
        assignment_id: assignment?.assignment_id || '',
        driver_id: driver.driver_id,
        point_id: point.point_id,
        date: todayDate(),
        assigned_boxes: assignment?.assigned_boxes || 0,
        delivered_boxes: parseInt(deliveredBoxes),
        photo_base64: stripBase64Prefix(photoDataURL),
        photo_type: 'image/jpeg',
        signature_base64: stripBase64Prefix(signatureDataURL),
        gps_lat: gps.lat,
        gps_lng: gps.lng,
        drive_folder_id: point.drive_folder_id,
      });
      if (result.success) {
        setDone(true);
      } else {
        setSubmitError(result.error || 'Submission failed. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    }
    setSubmitting(false);
  };

  // ── Success screen ─────────────────────────────────────────────
  if (done) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>POD Submitted!</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: 8 }}>{point.point_name}</p>
        <p style={{ color: 'var(--text-sub)', marginBottom: 32, fontSize: 14 }}>
          {deliveredBoxes} of {assignment?.assigned_boxes} boxes delivered
        </p>
        <button className="btn btn-primary" style={{ maxWidth: 300 }} onClick={onDone}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{point.point_name}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Submit POD</div>
        </div>
        <button onClick={onDone}>✕ Back</button>
      </div>

      <div style={{ paddingBottom: 32 }}>

        {/* Box count */}
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 4 }}>
            Assigned boxes: <strong>{assignment?.assigned_boxes ?? '—'}</strong>
          </div>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Boxes Actually Delivered *
          </label>
          <input
            className="input"
            type="number"
            min="0"
            max={assignment?.assigned_boxes || 9999}
            placeholder="Enter number of boxes delivered"
            value={deliveredBoxes}
            onChange={e => setDeliveredBoxes(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          {deliveredBoxes !== '' && assignment?.assigned_boxes &&
            parseInt(deliveredBoxes) < parseInt(assignment.assigned_boxes) && (
            <div className="banner banner-error" style={{ margin: '8px 0 0', padding: '8px 12px' }}>
              ⚠️ Partial delivery — this will be flagged for admin review
            </div>
          )}
        </div>

        {/* GPS status */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📍 Location</div>
          {gps ? (
            <div className="banner banner-success" style={{ margin: 0 }}>
              ✓ GPS captured — {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
            </div>
          ) : gpsError ? (
            <div className="banner banner-error" style={{ margin: 0 }}>⚠️ {gpsError}</div>
          ) : (
            <div className="banner banner-info" style={{ margin: 0 }}>⏳ Getting your location...</div>
          )}
        </div>

        {/* Photo */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📷 Delivery Photo *</div>

          {/* Camera viewfinder */}
          {cameraActive && (
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', borderRadius: 8, background: '#000', display: 'block' }}
              />
              <button
                className="btn btn-orange"
                onClick={takePhoto}
                style={{ marginTop: 8 }}
              >
                📸 Capture Photo
              </button>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 8 }}
                onClick={() => {
                  stream?.getTracks().forEach(t => t.stop());
                  setStream(null);
                  setCameraActive(false);
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Photo preview */}
          {photoDataURL && !cameraActive && (
            <div style={{ marginBottom: 8 }}>
              <img
                src={photoDataURL}
                alt="Delivery photo"
                style={{ width: '100%', borderRadius: 8, border: '2px solid var(--success)', display: 'block' }}
              />
              <button
                className="btn btn-ghost"
                style={{ marginTop: 8 }}
                onClick={retakePhoto}
              >
                Retake Photo
              </button>
            </div>
          )}

          {/* Open camera button */}
          {!cameraActive && !photoDataURL && (
            <button className="btn btn-primary" onClick={openCamera}>
              Open Camera
            </button>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

          <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 8 }}>
            Camera only — no gallery upload allowed
          </p>
        </div>

        {/* Signature */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✍️ Receiver Signature *</div>
          <SignaturePad onConfirm={(data) => setSignatureDataURL(data)} />
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="banner banner-error">{submitError}</div>
        )}

        {/* Submit checklist */}
        <div className="card" style={{ background: '#fafafa' }}>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 8 }}>Checklist before submitting:</div>
          {[
            [!!deliveredBoxes, 'Box count entered'],
            [!!photoDataURL, 'Photo captured'],
            [!!signatureDataURL, 'Signature confirmed'],
            [!!gps, 'GPS location captured'],
          ].map(([ok, label]) => (
            <div key={label} style={{ fontSize: 14, marginBottom: 4, color: ok ? 'var(--success)' : 'var(--text-sub)' }}>
              {ok ? '✓' : '○'} {label}
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div style={{ padding: '0 16px' }}>
          <button
            className="btn btn-success"
            disabled={!canSubmit}
            onClick={handleSubmit}
            style={{ fontSize: 17, padding: 16 }}
          >
            {submitting ? '⏳ Uploading...' : '✅ Submit POD'}
          </button>
        </div>

      </div>
    </div>
  );
}
