import { useAlaways, useRefConst, useRefConstWith } from "./useRef"

export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const get = useAlaways(fun)
  return useRefConstWith<T>(function (...vs) {
    return get()(...vs)
  } as T)
}