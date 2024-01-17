import { createContext } from "mvr-core"
import { useComputedValue, useMemo, useStoreTriggerRender } from "mvr-helper"
import { RWValue, ValueCenter, emptyArray, initRWValue, quote, valueCenterOf } from "wy-helper"

export type Model = {
  /**
   * 全局独一无二的名字
   */
  name: string

  /**构造方法 */
  init?: string

  /**消息处理方法*/
  methods?: string[]
}
export function getModelKey(model: Model) {
  return model.name
}




const saveModelKey = 'save-model-key2'
function initModelKey() {
  return JSON.parse(localStorage.getItem(saveModelKey) || '[]')
}
export const modelListStore = valueCenterOf<Model[]>(initModelKey())
modelListStore.subscribe(function (value) {
  localStorage.setItem(saveModelKey, JSON.stringify(value))
})


const errorContext = createContext<string[]>([])


export function useErrorContextProvide(errors: string[]) {
  const list = errorContext.useConsumer()
  const allErrors = list.concat(errors)
  errorContext.useProvider(allErrors)
  return allErrors
}