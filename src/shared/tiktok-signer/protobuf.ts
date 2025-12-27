// ------------------------------
// ProtoError
// ------------------------------
export class ProtoError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ProtoError";
  }
}

// ------------------------------
// Enum ProtoFieldType
// ------------------------------
export enum ProtoFieldType {
  VARINT = 0,
  INT64 = 1,
  STRING = 2,
  GROUPSTART = 3,
  GROUPEND = 4,
  INT32 = 5,
  ERROR1 = 6,
  ERROR2 = 7,
}

// ------------------------------
// ProtoField
// ------------------------------
export class ProtoField {
  constructor(
    public idx: number,
    public type: ProtoFieldType,
    public val: any
  ) {}

  isAsciiStr(): boolean {
    if (!(this.val instanceof Uint8Array)) return false;
    for (const b of this.val) {
      if (b < 0x20 || b > 0x7e) return false;
    }
    return true;
  }

  toString(): string {
    if (
      this.type === ProtoFieldType.INT32 ||
      this.type === ProtoFieldType.INT64 ||
      this.type === ProtoFieldType.VARINT
    ) {
      return `${this.idx}(${ProtoFieldType[this.type]}): ${this.val}`;
    } else if (this.type === ProtoFieldType.STRING) {
      if (this.isAsciiStr()) {
        return `${this.idx}(${
          ProtoFieldType[this.type]
        }): "${new TextDecoder().decode(this.val)}"`;
      }
      // Browser compatible: convert Uint8Array to hex without Buffer
      const hexStr = Array.from(this.val as Uint8Array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `${this.idx}(${ProtoFieldType[this.type]}): h"${hexStr}"`;
    } else {
      return `${this.idx}(${ProtoFieldType[this.type]}): ${this.val}`;
    }
  }
}

// ------------------------------
// ProtoReader
// ------------------------------
export class ProtoReader {
  private pos = 0;

  constructor(private data: Uint8Array) {}

  seek(pos: number) {
    this.pos = pos;
  }

  isRemain(length: number): boolean {
    return this.pos + length <= this.data.length;
  }

  read0(): number {
    if (!this.isRemain(1)) throw new ProtoError("read0(): OOB");
    return this.data[this.pos++]! & 0xff;
  }

  read(length: number): Uint8Array {
    if (!this.isRemain(length)) throw new ProtoError("read(): OOB");
    const ret = this.data.slice(this.pos, this.pos + length);
    this.pos += length;
    return ret;
  }

  readInt32(): number {
    const b = this.read(4);
    return (b[0]! | (b[1]! << 8) | (b[2]! << 16) | (b[3]! << 24)) >>> 0;
  }

  readInt64(): number {
    const b = this.read(8);
    return Number(
      BigInt(b[0]!) |
        (BigInt(b[1]!) << 8n) |
        (BigInt(b[2]!) << 16n) |
        (BigInt(b[3]!) << 24n) |
        (BigInt(b[4]!) << 32n) |
        (BigInt(b[5]!) << 40n) |
        (BigInt(b[6]!) << 48n) |
        (BigInt(b[7]!) << 56n)
    );
  }

  readVarint(): number {
    let vint = 0;
    let shift = 0;
    while (true) {
      const byte = this.read0();
      vint |= (byte & 0x7f) << shift;
      if (byte < 0x80) break;
      shift += 7;
    }
    return vint >>> 0;
  }

  readString(): Uint8Array {
    const length = this.readVarint();
    return this.read(length);
  }

  eof(): boolean {
    return this.pos >= this.data.length;
  }
}

// ------------------------------
// ProtoWriter
// ------------------------------
export class ProtoWriter {
  private data: number[] = [];

  write0(byte: number) {
    this.data.push(byte & 0xff);
  }

  write(bytes: Uint8Array) {
    for (const b of bytes) this.data.push(b);
  }

  writeInt32(v: number) {
    this.write(
      new Uint8Array([
        v & 0xff,
        (v >> 8) & 0xff,
        (v >> 16) & 0xff,
        (v >> 24) & 0xff,
      ])
    );
  }

  writeInt64(v: number) {
    const b = new Uint8Array([
      v & 0xff,
      (v >> 8) & 0xff,
      (v >> 16) & 0xff,
      (v >> 24) & 0xff,
      (v >> 32) & 0xff,
      (v >> 40) & 0xff,
      (v >> 48) & 0xff,
      (v >> 56) & 0xff,
    ]);
    this.write(b);
  }

  writeVarint(v: number) {
    v = v >>> 0; // simulate uint32
    while (v > 0x80) {
      this.write0((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    this.write0(v & 0x7f);
  }

  writeString(bytes: Uint8Array) {
    this.writeVarint(bytes.length);
    this.write(bytes);
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.data);
  }
}

// ------------------------------
// ProtoBuf
// ------------------------------
export class ProtoBuf {
  fields: ProtoField[] = [];

  constructor(data?: Uint8Array | Record<number, any>) {
    if (data instanceof Uint8Array && data.length > 0) {
      this.parseBuf(data);
    } else if (data && typeof data === "object") {
      this.parseDict(data);
    }
  }

  get(idx: number): ProtoField | undefined {
    return this.fields.find((f) => f.idx === idx);
  }

  getList(idx: number): ProtoField[] {
    return this.fields.filter((f) => f.idx === idx);
  }

  put(f: ProtoField) {
    this.fields.push(f);
  }

  putInt32(idx: number, v: number) {
    this.put(new ProtoField(idx, ProtoFieldType.INT32, v));
  }

  putInt64(idx: number, v: number) {
    this.put(new ProtoField(idx, ProtoFieldType.INT64, v));
  }

  putVarint(idx: number, v: number) {
    this.put(new ProtoField(idx, ProtoFieldType.VARINT, v));
  }

  putBytes(idx: number, b: Uint8Array) {
    this.put(new ProtoField(idx, ProtoFieldType.STRING, b));
  }

  putUtf8(idx: number, s: string) {
    this.put(
      new ProtoField(idx, ProtoFieldType.STRING, new TextEncoder().encode(s))
    );
  }

  putProtoBuf(idx: number, pb: ProtoBuf) {
    this.put(new ProtoField(idx, ProtoFieldType.STRING, pb.toBuf()));
  }

  parseBuf(bytes: Uint8Array) {
    const r = new ProtoReader(bytes);
    while (r.isRemain(1)) {
      const key = r.readVarint();
      const type = key & 7;
      const idx = key >> 3;

      if (idx === 0) break;

      switch (type) {
        case ProtoFieldType.INT32:
          this.put(new ProtoField(idx, type, r.readInt32()));
          break;
        case ProtoFieldType.INT64:
          this.put(new ProtoField(idx, type, r.readInt64()));
          break;
        case ProtoFieldType.VARINT:
          this.put(new ProtoField(idx, type, r.readVarint()));
          break;
        case ProtoFieldType.STRING:
          this.put(new ProtoField(idx, type, r.readString()));
          break;
        default:
          throw new ProtoError("unexpected field type " + type);
      }
    }
  }

  parseDict(dict: Record<number, any>) {
    for (const [kStr, v] of Object.entries(dict)) {
      const k = Number(kStr);
      if (typeof v === "number") {
        this.putVarint(k, v);
      } else if (typeof v === "string") {
        this.putUtf8(k, v);
      } else if (v instanceof Uint8Array) {
        this.putBytes(k, v);
      } else if (typeof v === "object" && v !== null) {
        // Check if it's array-like (has numeric keys) - treat as object dict
        this.putProtoBuf(k, new ProtoBuf(v));
      } else {
        throw new ProtoError("Unsupported type in dict");
      }
    }
  }

  toBuf(): Uint8Array {
    const w = new ProtoWriter();
    for (const f of this.fields) {
      const key = (f.idx << 3) | (f.type & 7);
      w.writeVarint(key);

      switch (f.type) {
        case ProtoFieldType.INT32:
          w.writeInt32(f.val);
          break;
        case ProtoFieldType.INT64:
          w.writeInt64(f.val);
          break;
        case ProtoFieldType.VARINT:
          w.writeVarint(f.val);
          break;
        case ProtoFieldType.STRING:
          w.writeString(f.val);
          break;
        default:
          throw new ProtoError("Unexpected field type");
      }
    }
    return w.toBytes();
  }

  static fromBuf(buf: Uint8Array): Record<number, any> {
    const r = new ProtoReader(buf);
    const out: Record<number, any> = {};

    while (!r.eof()) {
      const key = r.readVarint();
      const fieldNum = key >> 3;
      const wire = key & 7;

      let value: any;
      switch (wire) {
        case 0:
          value = r.readVarint();
          break;
        case 1:
          value = r.readInt64();
          break;
        case 2:
          value = r.readString();
          break;
        case 5:
          value = r.readInt32();
          break;
        default:
          throw new ProtoError("Unexpected wire type " + wire);
      }

      if (fieldNum in out) {
        if (Array.isArray(out[fieldNum])) {
          out[fieldNum].push(value);
        } else {
          out[fieldNum] = [out[fieldNum], value];
        }
      } else {
        out[fieldNum] = value;
      }
    }
    return out;
  }
}
