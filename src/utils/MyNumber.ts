import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');

export default class MyNumber {
  bigNumber: BigNumber;
  decimals: number;

  constructor(bigNumber: string, decimals: number) {
    this.bigNumber = new BigNumber(bigNumber);
    this.decimals = decimals;
  }

  static fromEther(num: string, decimals: number) {
    try {
      return new MyNumber(
        Number(ethers.parseUnits(num, decimals)).toFixed(6),
        decimals,
      );
    } catch (e) {
      console.error('fromEther', e, num, decimals);
      throw e;
    }
  }

  static fromZero() {
    return new MyNumber('0', 0);
  }

  toString() {
    return this.bigNumber.toFixed();
  }

  toEtherStr() {
    return ethers.formatUnits(this.bigNumber.toFixed(), this.decimals);
  }

  toFixedStr(decimals: number) {
    return Number(this.toEtherStr()).toFixed(decimals);
  }

  toEtherToFixedDecimals(decimals: number) {
    // rounding down
    return (
      Math.floor(parseFloat(this.toEtherStr()) * 10 ** decimals) /
      10 ** decimals
    ).toFixed(decimals);
  }

  isZero() {
    return this.bigNumber.eq('0');
  }

  /**
   *
   * @param amountEther in token terms without decimal e.g. 1 for 1 STRK
   * @param command BigNumber compare funds. e.g. gte, gt, lt
   * @returns
   * @dev Add more commands as needed
   */
  compare(amountEther: string, command: 'gte' | 'gt' | 'lt') {
    const fullNum = new BigNumber(
      ethers.parseUnits(amountEther, this.decimals).toString(),
    );
    return this.bigNumber[command](fullNum);
  }

  operate(command: 'div' | 'plus' | 'mul', value: string | number) {
    const bn = new BigNumber(Number(value).toFixed(6));
    return new MyNumber(this.bigNumber[command](bn).toFixed(0), this.decimals);
  }

  subtract(value: MyNumber) {
    const bn = this.bigNumber.minus(value.bigNumber);
    return new MyNumber(bn.toString(), this.decimals);
  }

  static min(a: MyNumber, b: MyNumber) {
    if (a.decimals !== b.decimals) {
      const diff = Math.abs(a.decimals - b.decimals);
      if (a.decimals > b.decimals) {
        b = new MyNumber(b.bigNumber.times(10 ** diff).toString(), a.decimals);
      } else {
        a = new MyNumber(a.bigNumber.times(10 ** diff).toString(), b.decimals);
      }
    }
    const bn = BigNumber.min(a.bigNumber, b.bigNumber);
    return new MyNumber(
      bn.toString(),
      a.decimals > b.decimals ? a.decimals : b.decimals,
    );
  }

  static max(a: MyNumber, b: MyNumber) {
    if (a.decimals !== b.decimals) {
      const diff = Math.abs(a.decimals - b.decimals);
      if (a.decimals > b.decimals) {
        b = new MyNumber(b.bigNumber.times(10 ** diff).toString(), a.decimals);
      } else {
        a = new MyNumber(a.bigNumber.times(10 ** diff).toString(), b.decimals);
      }
    }
    const bn = BigNumber.max(a.bigNumber, b.bigNumber);
    return new MyNumber(
      bn.toString(),
      a.decimals > b.decimals ? a.decimals : b.decimals,
    );
  }

  [customInspectSymbol](depth: any, inspectOptions: any, inspect: any) {
    return JSON.stringify({ raw: this.toString(), decimals: this.decimals });
  }
}
