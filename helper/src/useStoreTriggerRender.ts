import { useEffect } from "./useEffect";
import { EmptyFun, RWValue, ValueCenter, emptyArray, initRWValue, quote } from "wy-helper";
import { useModelValue } from './useModelState'
import { useMemo } from "./useRef";
/**
 * 
 * @param subscribe 最好保证订阅函数的独立
 * @param getSnapshot 
 * @returns 
 */
export function useSyncExternalStore<T>(subscribe: (callback: EmptyFun) => EmptyFun, getSnapshot: () => T) {
  const state = useModelValue(getSnapshot())
  useEffect(() => {
    if (state.value != getSnapshot()) {
      state.value = getSnapshot()
    }
    return subscribe(function () {
      state.value = getSnapshot()
    })
  }, [subscribe])
  return state.value
}
/**
 *
 * @param store
 * @param arg 只能初始化,中间不可以改变,即使改变,也是跟随的
 */
export function useStoreTriggerRender<T, M>(store: ValueCenter<T>, filter: (a: T) => M): M;
export function useStoreTriggerRender<T>(store: ValueCenter<T>, filter?: (a: T) => T): T;
export function useStoreTriggerRender<T>(store: ValueCenter<T>) {
  const filter = arguments[1] || quote
  return useSyncExternalStore(store.subscribe, function () {
    return filter(store.get())
  })
}


export function useStoreValue<T, M>(store: ValueCenter<T>, filter: (a: T) => M, build: (a: M, old: T) => T): RWValue<M>;
export function useStoreValue<T>(store: ValueCenter<T>, filter?: (a: T) => T, build?: (a: T, old: T) => T): RWValue<T>;
export function useStoreValue<T>(store: ValueCenter<T>): RWValue<T> {
  const filter = arguments[1] || quote
  const build = arguments[2] || quote
  useStoreTriggerRender(store, filter)
  return useMemo(() => {
    return initRWValue(function () {
      return filter(store.get())
    }, function (v) {
      store.set(build(v, store.get()))
    })
  }, emptyArray)
}