import {
  getCroppedAvatarBlob,
  getCroppedAvatarFile,
  getCroppedSquareFile,
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

function mockCropCanvas(options?: {
  nullContextCall?: number;
  blob?: Blob | null;
}) {
  const originalImage = global.Image;
  const originalCreateElement = document.createElement.bind(document);
  let contextCalls = 0;

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
        getContext: () => {
          contextCalls += 1;
          if (options?.nullContextCall === contextCalls) return null;
          return ctx;
        },
        toBlob: (cb: (blob: Blob | null) => void) =>
          cb(
            options && "blob" in options
              ? (options.blob ?? null)
              : new Blob(["png"], { type: "image/png" })
          ),
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

describe("getCroppedAvatarBlob failure paths", () => {
  const crop = { x: 0, y: 0, width: 40, height: 40 };

  it.each([
    [1, "Could not create a drawing surface for the avatar."],
    [2, "Could not create the cropped avatar canvas."],
    [3, "Could not create a temporary crop canvas."],
  ])("throws when canvas context call %s is missing", async (call, message) => {
    const restore = mockCropCanvas({ nullContextCall: call });
    try {
      await expect(getCroppedAvatarBlob("blob:test", crop)).rejects.toThrow(
        message
      );
    } finally {
      restore();
    }
  });

  it("throws when the canvas cannot encode a blob", async () => {
    const restore = mockCropCanvas({ blob: null });
    try {
      await expect(getCroppedAvatarBlob("blob:test", crop)).rejects.toThrow(
        "Could not encode the cropped avatar."
      );
    } finally {
      restore();
    }
  });
});

describe("getCroppedSquareFile", () => {
  const crop = { x: 4, y: 4, width: 32, height: 32 };

  it("rejects an empty crop area", async () => {
    await expect(
      getCroppedSquareFile("blob:test", { x: 0, y: 0, width: 0, height: 10 })
    ).rejects.toThrow("Crop area must be larger than zero.");
  });

  it("returns a square PNG cover", async () => {
    const restore = mockCropCanvas();
    try {
      const file = await getCroppedSquareFile(
        "blob:test",
        crop,
        "cover.jpg"
      );
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("cover.png");
      expect(file.type).toBe("image/png");
    } finally {
      restore();
    }
  });

  it.each([
    [1, "Could not create a drawing surface for the cover."],
    [2, "Could not create the cropped cover canvas."],
    [3, "Could not create a temporary crop canvas."],
  ])("throws when canvas context call %s is missing", async (call, message) => {
    const restore = mockCropCanvas({ nullContextCall: call });
    try {
      await expect(getCroppedSquareFile("blob:test", crop)).rejects.toThrow(
        message
      );
    } finally {
      restore();
    }
  });

  it("throws when the canvas cannot encode a blob", async () => {
    const restore = mockCropCanvas({ blob: null });
    try {
      await expect(getCroppedSquareFile("blob:test", crop)).rejects.toThrow(
        "Could not encode the cropped cover."
      );
    } finally {
      restore();
    }
  });
});
