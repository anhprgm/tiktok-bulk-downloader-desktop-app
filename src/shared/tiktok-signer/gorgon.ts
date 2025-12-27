import { IGorgonOptions } from '@shared/interfaces/Gorgon.interface'
import { md5Hex } from '@shared/tiktok-signer/crypto-utils'

export class Gorgon {
  private unix: number
  private params: string
  private bodyPayload?: string
  private cookies?: string

  constructor({ params, unix, bodyPayload, cookies }: IGorgonOptions) {
    this.unix = unix
    this.params = params
    this.bodyPayload = bodyPayload
    this.cookies = cookies
  }

  private hash(data: string): string {
    return md5Hex(data)
  }

  private getBaseString(): string {
    let base = this.hash(this.params)
    base += this.bodyPayload ? this.hash(this.bodyPayload) : '0'.repeat(32)
    base += this.cookies ? this.hash(this.cookies) : '0'.repeat(32)
    return base
  }

  public getValue() {
    return this.encrypt(this.getBaseString())
  }

  private encrypt(data: string) {
    const LEN = 0x14

    const key = [
      0xdf, 0x77, 0xb9, 0x40, 0xb9, 0x9b, 0x84, 0x83, 0xd1, 0xb9, 0xcb, 0xd1, 0xf7, 0xc2, 0xb9,
      0x85, 0xc3, 0xd0, 0xfb, 0xc3
    ]

    const paramList: number[] = []

    // Lấy 12 bytes đầu trong 96 ký tự hex (48 bytes)
    for (let i = 0; i < 12; i += 4) {
      const temp = data.substring(8 * i, 8 * (i + 1)) // 8 hex chars = 4 bytes
      for (let j = 0; j < 4; j++) {
        const value = parseInt(temp.substring(j * 2, (j + 1) * 2), 16)
        paramList.push(value)
      }
    }

    // Append fixed values
    paramList.push(0x00, 0x06, 0x0b, 0x1c)

    // Append timestamp (4 bytes)
    const ts = this.unix >>> 0 // convert to uint32

    paramList.push((ts & 0xff000000) >>> 24)
    paramList.push((ts & 0x00ff0000) >>> 16)
    paramList.push((ts & 0x0000ff00) >>> 8)
    paramList.push((ts & 0x000000ff) >>> 0)

    // XOR paramList with key
    const eorList = paramList.map((v, i) => v ^ key[i]!)

    // Main loop
    for (let i = 0; i < LEN; i++) {
      const C = this.reverse(eorList[i]!)
      const D = eorList[(i + 1) % LEN]!
      const E = C ^ D
      const F = this.rbit(E)
      const H = (F ^ 0xffffffff ^ LEN) & 0xff
      eorList[i] = H
    }

    // Convert to hex string
    let result = ''
    for (const p of eorList) {
      result += this.toHex(p)
    }

    return {
      'x-ss-req-ticket': String(this.unix * 1000),
      'X-Khronos': String(this.unix),
      'X-Gorgon': '0404b0d30000' + result
    }
  }

  // Reverse hex digits: e.g. A4 => 4A
  private reverse(num: number): number {
    const hex = this.toHex(num)
    return parseInt(hex[1]! + hex[0]!, 16)
  }

  // Convert number → 2-byte hex string
  private toHex(num: number): string {
    return num.toString(16).padStart(2, '0')
  }

  // Reverse bits
  private rbit(num: number): number {
    const bin = num.toString(2).padStart(8, '0')
    const rev = bin.split('').reverse().join('')
    return parseInt(rev, 2)
  }
}
