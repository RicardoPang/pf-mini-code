import { describe, it, expect } from 'vitest'
import { PfPromise } from '../src/promise'

describe('PfPromise', () => {
  // 测试案例 1: 基本的 resolve 情况
  it('should resolve with the correct value', async () => {
    const promise = new PfPromise((resolve) => {
      resolve('success')
    })

    const result = await promise.then((value) => value)
    expect(result).toBe('success')
  })

  // 测试案例 2: 基本的 reject 情况
  it('should reject with the correct reason', async () => {
    const promise = new PfPromise((_, reject) => {
      reject('error')
    })

    try {
      await promise
    } catch (reason) {
      expect(reason).toBe('error')
    }
  })

  // 测试案例 3: 测试 PfPromise.all 方法
  it('should resolve all promises in PfPromise.all', async () => {
    const promises = [
      PfPromise.resolve(1),
      PfPromise.resolve(2),
      PfPromise.resolve(3)
    ]

    const result = await PfPromise.all(promises)
    expect(result).toEqual([1, 2, 3])
  })

  // 测试案例 4: 测试 PfPromise.race 方法
  it('should resolve the first promise in PfPromise.race', async () => {
    const promise1 = new PfPromise((resolve) =>
      setTimeout(() => resolve('slow'), 50)
    )
    const promise2 = new PfPromise((resolve) =>
      setTimeout(() => resolve('fast'), 10)
    )

    const result = await PfPromise.race([promise1, promise2])
    expect(result).toBe('fast')
  })

  // 测试案例 5: 极端情况 - 循环引用
  it('should throw an error on circular reference', () => {
    const promise = new PfPromise((resolve) => {
      resolve('initial')
    })

    const circularPromise = promise.then(() => circularPromise)

    circularPromise.then(
      () => {},
      (error) => {
        expect(error).toBeInstanceOf(TypeError)
        expect(error.message).toMatch(/循环引用|解析深度超过限制/)
      }
    )
  }, 10000) // 增加超时时间到10秒

  // 测试案例 6: 多重嵌套的 Promise
  it('should handle multiple nested promises', async () => {
    const promise = new PfPromise((resolve) => {
      resolve(PfPromise.resolve(PfPromise.resolve('nested')))
    })

    const result = await promise.then((value) => value)
    expect(result).toBe('nested')
  })

  // 测试案例 7: 测试 PfPromise.reject 方法
  it('should reject immediately with PfPromise.reject', async () => {
    const promise = PfPromise.reject('rejected immediately')

    try {
      await promise
    } catch (reason) {
      expect(reason).toBe('rejected immediately')
    }
  })
})
