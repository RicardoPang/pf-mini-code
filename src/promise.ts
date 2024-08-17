export class PfPromise {
  private status: 'pending' | 'resolved' | 'rejected' = 'pending'
  private value: any
  private onResolvedCallbacks: Array<(value: any) => void> = []
  private onRejectedCallbacks: Array<(reason: any) => void> = []

  constructor(
    executor: (
      resolve: (value: any) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    try {
      executor(this.resolve.bind(this), this.reject.bind(this))
    } catch (error) {
      this.reject(error)
    }
  }

  private resolve(value: any) {
    if (value instanceof PfPromise) {
      return value.then(this.resolve.bind(this), this.reject.bind(this))
    }
    setTimeout(() => {
      if (this.status === 'pending') {
        this.status = 'resolved'
        this.value = value
        this.onResolvedCallbacks.forEach((callback) => callback(value))
      }
    })
  }

  private reject(reason: any) {
    setTimeout(() => {
      if (this.status === 'pending') {
        this.status = 'rejected'
        this.value = reason
        this.onRejectedCallbacks.forEach((callback) => callback(reason))
      }
    })
  }

  then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) {
    return new PfPromise((resolve, reject) => {
      const fulfilledCallback = () => {
        try {
          const result = onFulfilled ? onFulfilled(this.value) : this.value
          resolvePromise(result, resolve, reject)
        } catch (error) {
          reject(error)
        }
      }

      const rejectedCallback = () => {
        try {
          const result = onRejected ? onRejected(this.value) : this.value
          resolvePromise(result, resolve, reject)
        } catch (error) {
          reject(error)
        }
      }

      if (this.status === 'resolved') {
        setTimeout(fulfilledCallback)
      } else if (this.status === 'rejected') {
        setTimeout(rejectedCallback)
      } else {
        this.onResolvedCallbacks.push(fulfilledCallback)
        this.onRejectedCallbacks.push(rejectedCallback)
      }
    })
  }

  catch(onRejected: (reason: any) => any) {
    return this.then(undefined, onRejected)
  }

  static all(promises: PfPromise[]) {
    return new PfPromise((resolve, reject) => {
      const results: any[] = []
      let completed = 0

      promises.forEach((promise, index) => {
        promise
          .then((data) => {
            results[index] = data
            completed++
            if (completed === promises.length) {
              resolve(results)
            }
          })
          .catch(reject)
      })
    })
  }

  static race(promises: PfPromise[]) {
    return new PfPromise((resolve, reject) => {
      promises.forEach((promise) => {
        promise.then(resolve).catch(reject)
      })
    })
  }

  static resolve(value: any) {
    return new PfPromise((resolve) => resolve(value))
  }

  static reject(reason: any) {
    return new PfPromise((_, reject) => reject(reason))
  }
}

function resolvePromise(
  x: any,
  resolve: (value: any) => void,
  reject: (reason: any) => void,
  visited = new Set<any>()
) {
  if (visited.has(x)) {
    return reject(new TypeError('循环引用'))
  }

  if (x instanceof PfPromise) {
    visited.add(x)
    x.then(
      (value) => resolvePromise(value, resolve, reject, visited),
      (reason) => reject(reason)
    )
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let then
    try {
      then = x.then
    } catch (error) {
      return reject(error)
    }

    if (typeof then === 'function') {
      let called = false
      try {
        visited.add(x)
        then.call(
          x,
          (y) => {
            if (called) return
            called = true
            resolvePromise(y, resolve, reject, visited)
          },
          (r) => {
            if (called) return
            called = true
            reject(r)
          }
        )
      } catch (error) {
        if (!called) {
          reject(error)
        }
      }
    } else {
      resolve(x)
    }
  } else {
    resolve(x)
  }
}
