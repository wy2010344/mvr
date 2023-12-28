import { useModel } from "mvr-core";


export type HookStateValueOut<T> = [T, (v: T) => void, () => T]
export function useModelState<M, T>(initValue: M, initFun: (v: M) => T): HookStateValueOut<T>
export function useModelState<T>(initValue: T, initFun?: (v: T) => T): HookStateValueOut<T>
export function useModelState(...vs: any[]) {
  const [getState, setState] = useModel.apply(null, vs as any)
  return [getState(), setState, getState] as const
}