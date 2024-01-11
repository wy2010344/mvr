import { EmptyFun, GetValue, RValue, RWValue, emptyArray, initRWValue } from "wy-helper"
import { useComputed } from "./useModelState"
import { useMemo } from "./useRef"


export function useBuildSubSetObject<P, K extends keyof P>(
  parent: RWValue<P>,
  child: P[K],
  key: K
): RWValue<P[K]> {
  const get = useComputed(child)
  return useMemo(() => {
    return initRWValue(get, function (value) {
      parent.value = {
        ...parent.value,
        [key]: value
      }
    })
  }, emptyArray)
}



export function useBuildSubSetArray<T>(
  parent: RWValue<T[]>,
  child: T,
  getKey: (v: T) => any,
): readonly [RWValue<T>, EmptyFun] {
  const get = useComputed(child)
  return useMemo(() => {
    return [
      initRWValue(get, function (value) {
        const key = getKey(get())
        parent.value = parent.value.map(nv => {
          if (key == getKey(nv)) {
            return value!
          }
          return nv
        })
      }),
      function () {
        const key = getKey(get())
        parent.value = parent.value.filter(nv => getKey(nv) != key)
      }
    ] as const
  }, emptyArray)
}