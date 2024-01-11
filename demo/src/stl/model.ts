import { useMemo } from "mvr-helper"

export type Model = {
  name: string
  attributes?: Attribute[]
  methods?: Method[]
  init?: Init
}

export type Init = {
  args?: string
  body?: string
}

export type Attribute = {
  name: string
  /**只读,表示必须初始化构建*/
  readonly?: boolean
}

export type Method = {
  title: string
  body: string
}
export function getModelKey(model: Model) {
  return model.name
}

export function getAttributeKey(atr: Attribute) {
  return atr.name
}

export function useStrFilter<T>(filter: string, list: T[], getKey: (v: T) => string) {
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