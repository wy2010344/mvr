import { useComputedValue, useMemo, useStoreTriggerRender } from "mvr-helper"
import { RWValue, ValueCenter, emptyArray, initRWValue, quote } from "wy-helper"

export function useStrFilter<T>(
  filter: string,
  list: T[],
  getKey: (v: T) => string
) {
  return useMemo(() => {
    const inputLowerCase = filter.trim().toLocaleLowerCase()
    const showModelList = list.filter(v => {
      return getKey(v).toLocaleLowerCase().includes(inputLowerCase)
    })
    const matchItem = showModelList.find(v => getKey(v) == filter)
    return {
      showModelList,
      matchItem
    }
  }, [filter, list])
}


export function useValueCenterValue<T>(
  store: ValueCenter<T>
): RWValue<T>
export function useValueCenterValue<T, F>(
  store: ValueCenter<T>,
  filter: (v: T) => F,
  build: (v: F, old: T) => T
): RWValue<F>
export function useValueCenterValue(store: ValueCenter<any>) {
  const filter = arguments[1] || quote
  const build = arguments[2] || quote
  const modelList = useStoreTriggerRender(store, filter)
  const getValue = useComputedValue(modelList)
  return useMemo(() => {
    return initRWValue(getValue.get, value => {
      store.set(build(value, store.get()))
    })
  }, emptyArray)
}