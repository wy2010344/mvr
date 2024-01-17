import { useEffect } from "./useEffect";
import { EmptyFun, ValueCenter, quote } from "wy-helper";
import { useModelValue } from './useModelState'
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