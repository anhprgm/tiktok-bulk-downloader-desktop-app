import { pkcs7PaddingDataLength } from "./pkcs7_padding";

export class ByteBuf {
  private mem: Uint8Array | undefined;
  private dataSize: number;
  private pos: number = 0;

  constructor(data?: Uint8Array, size?: number) {
    if (data) {
      this.mem = data;
    }

    if (size !== undefined) {
      this.dataSize = size;
    } else if (data) {
      this.dataSize = data.length;
    } else {
      throw new Error("either size or data must be provided");
    }
  }

  data(): Uint8Array {
    return this.mem!;
  }

  size(): number {
    return this.dataSize;
  }

  removePadding(): Uint8Array {
    const paddingSize = pkcs7PaddingDataLength(this.mem!, this.dataSize, 16);

    if (paddingSize === 0) {
      return this.mem!; // Không đổi nếu padding không hợp lệ
    }

    this.dataSize = paddingSize;

    // Tạo buffer mới (tương đương ctypes slice)
    const dst = this.mem!.slice(0, this.dataSize);

    this.mem = dst;
    return this.mem!;
  }
}
