import qs from 'qs'
import {
  allocBytes,
  hexToBytes,
  stringToBytes,
  readBigUInt64LE,
  writeBigUInt64LE,
  concatBytes,
  asciiToBytes,
  bytesToBase64
} from './buffer-utils'
import { md5Bytes, pkcs7Pad, aesCbcEncrypt } from './crypto-utils'
import { ProtoBuf } from './protobuf'
import { simonEnc } from './simon'
import { SM3 } from './sm3'

// PKCS7 pad for Uint8Array
function pkcs7PadBytes(buf: Uint8Array, blockSize = 16): Uint8Array {
  const pad = blockSize - (buf.length % blockSize)
  const out = allocBytes(buf.length + pad)
  out.set(buf, 0)
  out.fill(pad, buf.length)
  return out
}

export class Argus {
  // SIGN_KEY and SM3_OUTPUT hex derived from python bytes literal
  private static SIGN_KEY = hexToBytes(
    'ac1adaae95a7af94a5114ab3b3a97dd80050aa0a39314c40528caec95256c28c'
  )
  private static SM3_OUTPUT = hexToBytes(
    'fc78e0a9657a0c748ce51559903ccf03510e51d3cff232d71343e88a321c5304'
  )

  private static encryptEncPb(data: Uint8Array, length: number): Uint8Array {
    // data: Uint8Array; Python did list(data) then XOR using first 8 bytes, then reversed bytes
    const arr = new Uint8Array(data.subarray(0, length))
    const xorArray = new Uint8Array(arr.subarray(0, 8))

    for (let i = 8; i < length; i++) {
      arr[i] = arr[i]! ^ xorArray[i % 8]!
    }

    // return reversed bytes
    const reversed = allocBytes(arr.length)
    for (let i = 0; i < arr.length; i++) {
      reversed[i] = arr[arr.length - 1 - i]!
    }
    return reversed
  }

  static getBodyhash(stub?: string | null): Uint8Array {
    if (!stub || stub.length === 0) {
      return new SM3().sm3Hash(new Uint8Array(16)).subarray(0, 6)
    }
    // stub expected hex string
    const stubBytes = hexToBytes(stub)
    return new SM3().sm3Hash(stubBytes).subarray(0, 6)
  }

  static getQueryhash(query?: string | null): Uint8Array {
    if (!query || query.length === 0) {
      return new SM3().sm3Hash(allocBytes(16)).subarray(0, 6)
    }
    return new SM3().sm3Hash(stringToBytes(query)).subarray(0, 6)
  }

  private static prepareKeyList(key: Uint8Array): bigint[] {
    // Python used unpack("<QQ", ...) twice to get four 64-bit little-endian unsigned ints
    const keyList: bigint[] = []
    for (let i = 0; i < 2; i++) {
      const slice = key.slice(i * 16, (i + 1) * 16)
      // read two little-endian uint64
      const lo = readBigUInt64LE(slice, 0)
      const hi = readBigUInt64LE(slice, 8)
      keyList.push(lo, hi)
    }
    return keyList
  }

  private static encryptBlocks(
    protobuf: Uint8Array,
    keyList: bigint[],
    newLen: number
  ): Uint8Array {
    const encPb = allocBytes(newLen)
    const blockCount = Math.floor(newLen / 16)
    for (let blockIdx = 0; blockIdx < blockCount; blockIdx++) {
      const offset = blockIdx * 16
      // read two little-endian uint64 -> pass to simonEnc as bigint[]
      const a = readBigUInt64LE(protobuf, offset)
      const b = readBigUInt64LE(protobuf, offset + 8)
      const pt: bigint[] = [a, b]
      const ct: bigint[] = simonEnc(pt, keyList) // giả sử simonEnc nhận/return bigint[]
      // write back little-endian
      writeBigUInt64LE(encPb, ct[0]!, offset)
      writeBigUInt64LE(encPb, ct[1]!, offset + 8)
    }
    return encPb
  }

  static encrypt(xargusBean: any): string {
    // Build protobuf buffer
    // ProtoBuf(xargus_bean).toBuf().hex() in python -> bytes.fromhex(...) => effectively use toBuf() directly
    const pb = new ProtoBuf(xargusBean).toBuf() // Uint8Array

    // pad to AES block size (16)
    const protobuf = pkcs7PadBytes(pb, 16)
    const newLen = protobuf.length

    // key is first 32 bytes of SM3_OUTPUT
    const key = Argus.SM3_OUTPUT.slice(0, 32)
    const keyList = Argus.prepareKeyList(key)
    const encPb = Argus.encryptBlocks(protobuf, keyList, newLen)

    const header = new Uint8Array([0xf2, 0xf7, 0xfc, 0xff, 0xf2, 0xf7, 0xfc, 0xff])
    let bBuffer: Uint8Array = concatBytes(header, encPb)
    bBuffer = Argus.encryptEncPb(bBuffer, newLen + 8) // reverse+xor
    bBuffer = concatBytes(
      new Uint8Array([0xa6, 0x6e, 0xad, 0x9f, 0x77, 0x01, 0xd0, 0x0c, 0x18]),
      bBuffer,
      asciiToBytes('ao')
    )

    // AES-CBC with key = MD5(SIGN_KEY[:16]), iv = MD5(SIGN_KEY[16:])
    const keyMd5 = md5Bytes(Argus.SIGN_KEY.slice(0, 16))
    const ivMd5 = md5Bytes(Argus.SIGN_KEY.slice(16))

    // cipher = new(AES).encrypt(pad(b_buffer, block_size))
    const toEncrypt = pkcs7Pad(bBuffer, 16)
    const encrypted = aesCbcEncrypt(toEncrypt, keyMd5, ivMd5)

    const out = concatBytes(new Uint8Array([0xf2, 0x81]), encrypted)
    return bytesToBase64(out)
  }

  private static parseAppVersion(versionName: string): number {
    const parts = versionName.split('.')
    const p0 = Number(parts[0] ?? 0)
    const p1 = Number(parts[1] ?? 0)
    const p2 = Number(parts[2] ?? 0)

    // Python: '{:x}{:x}{:x}00'.format(int(parts[2]) * 4, int(parts[1]) * 16, int(parts[0]) * 4).zfill(8)
    // Ví dụ: version "41.4.5" => p0=41, p1=4, p2=5
    // => parts[2]*4=20 (hex: 14), parts[1]*16=64 (hex: 40), parts[0]*4=164 (hex: a4)
    // => "144a400" zfill(8) => "0144a400"
    const hexStr = (
      (p2 * 4).toString(16) +
      (p1 * 16).toString(16) +
      (p0 * 4).toString(16) +
      '00'
    ).padStart(8, '0')

    // int.from_bytes(..., byteorder='big') << 1
    const num = parseInt(hexStr, 16)
    return (num << 1) >>> 0
  }

  private static parseOsVersion(osVersionStr: string): number {
    const parts = osVersionStr.split('.').map((s) => Number(s))
    while (parts.length < 3) parts.push(0)
    return ((parts[0]! - 4 + parts[1]! * 256 + parts[2]! * 4096) * 2) >>> 0
  }

  static getSign({
    queryParams,
    x_ss_stub,
    timestamp,
    aid = 1233,
    licenseId = 1611921764,
    platform = 0,
    secDeviceId = '',
    sdkVersion = 'v05.00.03-ov-android',
    sdkVersionInt = 167773760
  }: {
    queryParams?: string
    x_ss_stub?: string
    timestamp?: number
    aid: number
    platform?: number
    licenseId?: number
    secDeviceId?: string
    sdkVersion?: string
    sdkVersionInt?: number
  }): string {
    if (!timestamp) {
      timestamp = Math.floor(Date.now() / 1000)
    }

    // parse query string -> get first value like parse_qs(...)[key][0]
    const params = qs.parse(queryParams ?? '')
    const getFirst = (k: string) => {
      const v = params[k]
      if (!v) return ''
      if (Array.isArray(v)) return String(v[0])
      return String(v)
    }

    const appVersionConstant = Argus.parseAppVersion(getFirst('version_name'))

    // Build xargus_bean (mirror Python structure)
    const xargusBean: Record<number, any> = {
      1: 0x20200929 * 2, // Python: 0x20200929 << 1
      2: 2,
      3: Math.floor(Math.random() * 0x80000000) >>> 0,
      4: String(aid),
      5: getFirst('device_id'),
      6: String(licenseId),
      7: getFirst('version_name'),
      8: sdkVersion,
      9: sdkVersionInt,
      10: new Uint8Array(8), // bytes(8) - phải dùng Uint8Array cho protobuf
      11: 'android',
      12: timestamp * 2, // Python: timestamp << 1 - tránh overflow
      13: Argus.getBodyhash(x_ss_stub),
      14: Argus.getQueryhash(queryParams ?? ''),
      15: {
        1: 85,
        2: 85,
        3: 85,
        5: 85,
        6: 170,
        7: timestamp * 2 - 310 // Python: (timestamp << 1) - 310
      },
      16: secDeviceId,
      20: 'none',
      21: 738,
      23: {
        1: getFirst('device_type'),
        2: 0,
        3: 'googleplay',
        4: appVersionConstant
      },
      25: 2
    }

    return Argus.encrypt(xargusBean)
  }
}
