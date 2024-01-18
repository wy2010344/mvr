import { modelListStore, modelStore } from "../model"


export interface Scope {
  get(key: string): any
  add(key: string): any
  set(key: string, value: any): void
}



export const globalScope = {

  get(key: string) {
    return modelStore.get().find(v => v.name == key)
  },
  add(key: string) {
    throw new Error("全局不允许增加")
  },
  set(key: string, value: any) {
    throw new Error("全局不允许修改")
  }
}