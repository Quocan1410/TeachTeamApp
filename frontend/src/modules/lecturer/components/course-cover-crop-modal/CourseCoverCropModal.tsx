"use client";

import React, { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import Modal from "@/shared/components/common/modal/Modal";
import { getCroppedSquareFile } from "@/shared/utils/cropAvatar";
import styles from "./CourseCoverCropModal.module.css";

type CourseCoverCropModalProps = {
  imageSrc: string | null;
  isOpen: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

const CourseCoverCropModal: React.FC<CourseCoverCropModalProps> = ({
  imageSrc,
  isOpen,
  isSaving = false,
  onCancel,
  onConfirm,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || isSaving || isPreparing) return;
    setIsPreparing(true);
    try {
      const file = await getCroppedSquareFile(
        imageSrc,
        croppedAreaPixels,
        "course-cover.png"
      );
      await onConfirm(file);
    } finally {
      setIsPreparing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Crop course cover"
      maxWidth="36rem"
      closeVariant="icon"
    >
      <div className={styles.body}>
        <div className={styles.stage}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <p className={styles.hint}>
          Drag to reposition. Zoom to fill the square cover.
        </p>
        <div className={styles.zoomRow}>
          <label className={styles.zoomLabel} htmlFor="course-cover-zoom">
            Zoom
          </label>
          <input
            id="course-cover-zoom"
            className={styles.zoom}
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={isSaving || isPreparing}
            onClick={() => void handleConfirm()}
          >
            {isSaving || isPreparing ? "Saving…" : "Save cover"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CourseCoverCropModal;
