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