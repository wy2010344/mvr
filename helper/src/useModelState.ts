import { useBaseComputed, useBaseModel } from "mvr-core";
import { RValue, GetValue, RWValue, SetValue, initRValue, initRWValue, quote } from "wy-helper";

function initModel<T>(get: GetValue<T>, set: SetValue<T>) {
  return [get, set] as const
}
type ValueOut<T> = [GetValue<T>, SetValue<T>]
export function useModel<M, T>(initValue: M, initFun: (v: M) => T): ValueOut<T>
export function useModel<T>(initValue: T, initFun?: (v: T) => T): ValueOut<T>
export function useModel(...vs: any[]) {
  return useBaseModel(vs[0], initModel, vs[1])
}
export type HookStateValueOut<T> = [T, (v: T) => void, () => T]
export function useModelState<M, T>(initValue: M, initFun: (v: M) => T): HookStateValueOut<T>
export function useModelState<T>(initValue: T, initFun?: (v: T) => T): HookStateValueOut<T>
export function useModelState(...vs: any[]) {
  const [getState, setState] = useModel.apply(null, vs as any)
  return [getState(), setState, getState] as const
}





export function useModelValue<M, T>(initValue: M, initFun: (v: M) => T): RWValue<T>
export function useModelValue<T>(initValue: T, initFun?: (v: T) => T): RWValue<T>
export function useModelValue<T>(): RWValue<T | undefined>
export function useModelValue(...vs: any[]) {
  return useBaseModel(vs[0], initRWValue, vs[1])
}



export function useComputedValue<T>(value: T): RValue<T> {
  return useBaseComputed(value, initRValue)
}




export function useComputed<T>(value: T): GetValue<T> {
  return useBaseComputed(value, quote)
}