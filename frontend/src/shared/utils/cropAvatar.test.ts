import {
  getCroppedAvatarBlob,
  getCroppedAvatarFile,
  getRadianAngle,
  rotateSize,
} from "./cropAvatar";

describe("getRadianAngle", () => {
  it("converts degrees to radians", () => {
    expect(getRadianAngle(0)).toBe(0);
    expect(getRadianAngle(180)).toBeCloseTo(Math.PI);
  });
});

describe("rotateSize", () => {
  it("keeps width and height when rotation is 0", () => {
    expect(rotateSize(100, 50, 0)).toEqual({ width: 100, height: 50 });
  });

  it("swaps the bounding box near 90 degrees", () => {
    const size = rotateSize(100, 40, 90);
    expect(size.width).toBeCloseTo(40);
    expect(size.height).toBeCloseTo(100);
  });
});

function mockCropCanvas() {
  const originalImage = global.Image;
  const originalCreateElement = document.createElement.bind(document);

  class FakeImage {
    width = 100;
    height = 100;
    crossOrigin = "";
    src = "";
    addEventListener(event: string, handler: () => void) {
      if (event === "load") {
        void Promise.resolve().then(handler);
      }
    }
  }
  // @ts-expect-error test double for HTMLImageElement
  global.Image = FakeImage;

  document.createElement = ((tag: string) => {
    if (tag === "canvas") {
      const ctx = {
        translate: jest.fn(),
        rotate: jest.fn(),
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        closePath: jest.fn(),
        clip: jest.fn(),
      };
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toBlob: (cb: (blob: Blob | null) => void) =>
          cb(new Blob(["png"], { type: "image/png" })),
      } as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tag);
  }) as typeof document.createElement;

  return () => {
    global.Image = originalImage;
    document.createElement = originalCreateElement;
  };
}

describe("getCroppedAvatarBlob", () => {
  it("rejects an empty crop area", async () => {
    await expect(
      getCroppedAvatarBlob("blob:test", { x: 0, y: 0, width: 0, height: 10 })
    ).rejects.toThrow("Crop area must be larger than zero.");
  });

  it("returns a PNG blob for a valid crop", async () => {
    const restore = mockCropCanvas();
    try {
      const blob = await getCroppedAvatarBlob("blob:test", {
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      });
      expect(blob.type).toBe("image/png");
    } finally {
      restore();
    }
  });
});

describe("getCroppedAvatarFile", () => {
  it("wraps the cropped blob as a PNG file", async () => {
    const restore = mockCropCanvas();
    try {
      const file = await getCroppedAvatarFile(
        "blob:test",
        { x: 0, y: 0, width: 40, height: 40 },
        "photo.jpg"
      );
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("photo.png");
      expect(file.type).toBe("image/png");
    } finally {
      restore();
    }
  });
});
