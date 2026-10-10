"use client";

import React, { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import Modal from "@/shared/components/common/modal/Modal";
import { getCroppedAvatarFile } from "@/shared/utils/cropAvatar";
import styles from "./AvatarCropModal.module.css";

type AvatarCropModalProps = {
  imageSrc: string | null;
  isOpen: boolean;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
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
      const file = await getCroppedAvatarFile(imageSrc, croppedAreaPixels);
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
      title="Crop your new profile picture"
      maxWidth="36rem"
      closeVariant="icon"
    >
      <div className={styles.avatarCropModal__body}>
        <h2 className={styles.avatarCropModal__title}>Crop your new profile picture</h2>
        <div className={styles.avatarCropModal__stage}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <p className={styles.avatarCropModal__hint}>
          Drag to reposition. Use zoom to frame your face in the circle.
        </p>
        <div className={styles.avatarCropModal__zoomRow}>
          <label className={styles.avatarCropModal__zoomLabel} htmlFor="avatar-crop-zoom">
            Zoom
          </label>
          <input
            id="avatar-crop-zoom"
            className={styles.avatarCropModal__zoom}
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom profile picture"
          />
        </div>
        <div className={styles.avatarCropModal__actions}>
          <button
            type="button"
            className={styles.avatarCropModal__confirm}
            onClick={() => void handleConfirm()}
            disabled={isSaving || isPreparing || !croppedAreaPixels}
          >
            {isSaving || isPreparing ? "Saving..." : "Set new profile picture"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AvatarCropModal;
