export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

export function rotateSize(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

/** Draw the selected square crop onto a circular PNG canvas. */
export async function getCroppedAvatarBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  outputSize = 512
): Promise<Blob> {
  if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
    throw new Error("Crop area must be larger than zero.");
  }

  const image = await loadImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create a drawing surface for the avatar.");
  }

  const rotRad = getRadianAngle(rotation);
  const { width: boundingWidth, height: boundingHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = boundingWidth;
  canvas.height = boundingHeight;

  ctx.translate(boundingWidth / 2, boundingHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  const output = document.createElement("canvas");
  output.width = outputSize;
  output.height = outputSize;
  const outputCtx = output.getContext("2d");
  if (!outputCtx) {
    throw new Error("Could not create the cropped avatar canvas.");
  }

  outputCtx.beginPath();
  outputCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  outputCtx.closePath();
  outputCtx.clip();

  const temp = document.createElement("canvas");
  temp.width = pixelCrop.width;
  temp.height = pixelCrop.height;
  const tempCtx = temp.getContext("2d");
  if (!tempCtx) {
    throw new Error("Could not create a temporary crop canvas.");
  }
  tempCtx.putImageData(data, 0, 0);
  outputCtx.drawImage(temp, 0, 0, outputSize, outputSize);

  return new Promise((resolve, reject) => {
    output.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode the cropped avatar."));
          return;
        }
        resolve(blob);
      },
      "image/png",
      0.95
    );
  });
}

export async function getCroppedAvatarFile(
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName = "avatar.png",
  rotation = 0
): Promise<File> {
  const blob = await getCroppedAvatarBlob(imageSrc, pixelCrop, rotation);
  return new File([blob], fileName.replace(/\.[^.]+$/, "") + ".png", {
    type: "image/png",
    lastModified: Date.now(),
  });
}
