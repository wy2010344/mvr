import { createContext } from "mvr-core"
import { valueCenterOf } from "wy-helper"
import { MethodNode } from "./parse/model"
import { MethodExp, parseMethod } from "./parse/parseMethod"
import { MToken, filterInUserToken, tokenize } from "./parse/tokenize"
import { useStoreValue } from "mvr-helper"
import { InitExp, parseInit } from "./parse/parseInit"

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

  modelStore.set(value.map(model => {
    const old = modelStore.get().find(v => v.name == model.name)
    if (old) {
      return translateToTModel(model, old)
    } else {
      return translateToTModel(model)
    }
  }))
})
export class TModel {
  constructor(
    readonly content: Model,
    readonly name: string,
    readonly init: TModelInit | undefined,
    readonly methods: TModelMethod[]
  ) { }
}
export type TModelInit = {
  content?: string
  tokens: MToken[]
  exp?: InitExp
}
export type TModelMethod = {
  content: string
  tokens: MToken[]
  exp?: MethodExp
}
function translateToTModel(model: Model, old?: TModel): TModel {
  if (old?.content == model) {
    return old
  }
  let init = old?.init
  if (init?.content != model.init) {
    const tokens = tokenize(model.init || '')
    init = {
      content: model.init,
      tokens,
      exp: parseInit(tokens)
    }
  }
  return new TModel(
    model,
    model.name,
    init,
    model.methods?.map(method => {
      const oldMethod = old?.methods.find(v => v.content == method)
      if (oldMethod) {
        return oldMethod
      }
      const tokens = tokenize(method)
      const exp = parseMethod(tokens.filter(filterInUserToken))
      return {
        content: method,
        tokens,
        exp
      }
    }) || []
  )
}

export const modelStore = valueCenterOf<TModel[]>(modelListStore.get().map(v => translateToTModel(v,)))

const errorContext = createContext<string[]>([])


export function useErrorContextProvide(errors: string[]) {
  const list = errorContext.useConsumer()
  const allErrors = list.concat(errors)
  errorContext.useProvider(allErrors)
  return allErrors
}