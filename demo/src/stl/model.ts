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

