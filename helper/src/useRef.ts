import { storeRef, quote, getTheEmptyArray } from 'wy-helper';
import { useComputed } from "mvr-core"
type StoreRef<T> = {
  get(): T
  set(v: T): void
}
/**
 * 如果rollback,不允许改变是持久的
 * 但是ref本质上就是持久的
 * 返回的是对象
 * @param init 
 * @returns 
 */
export function useAtomBind<M, T>(init: M, trans: (m: M) => T): StoreRef<T>
export function useAtomBind<T>(init: T): StoreRef<T>
export function useAtomBind() {
  const [init, oldTrans] = arguments
  return useComputed(() => {
    const trans = oldTrans || quote
    const ref = storeRef(trans(init))
    ref.get = ref.get.bind(ref)
    ref.set = ref.set.bind(ref)
    return ref
  }, getTheEmptyArray)()
}
export function useAtomBindFun<T>(init: () => T) {
  return useAtomBind(undefined, init)
}

export function useAtom<M, T>(init: M, trans: (m: M) => T): StoreRef<T>
export function useAtom<T>(init: T): StoreRef<T>
export function useAtom() {
  const [init, oldTrans] = arguments
  return useComputed(() => {
    const trans = oldTrans || quote
    return storeRef(trans(init))
  }, getTheEmptyArray)()
}
export function useAtomFun<T>(init: () => T) {
  return useAtom(undefined, init)
}
export function useRefConst<T>(fun: () => T) {
  return useAtomFun(fun).get()
}

export function useRefConstWith<T>(v: T) {
  return useAtom(v).get()
}