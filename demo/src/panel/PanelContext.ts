import { createContext } from "mvr-core"
import renderPanel, { PanelParams, Size } from "./renderPanel"
import { useRefConst, renderFragment, renderArray, useStoreTriggerRender } from 'mvr-helper'
import { valueCenterOf } from "wy-helper"

export type PanelCollection = {
  id: number
  callback(id: number): void
}[]

export type PanelOperate = {
  push(callback: () => void): number
  close(id: number): void
  exist(id: number): boolean
  moveToFirst(id: number): void
}
export const PanelContext = createContext<PanelOperate>({
  push() {
    throw new Error("")
  },
  exist() {
    throw new Error("")
  },
  moveToFirst() {
    throw new Error("")
  },
  close() {
    throw new Error("")
  }
})


export type PanelCallback<T> = (
  operate: PanelOperate,
  value: T
) => void
export function panelWith<T>({
  children,
  useArgs
}: {
  useArgs?(): Omit<PanelParams, "close" | "children" | "moveFirst">
  children: (operate: PanelOperate, id: number, arg: T, size: Size, div: HTMLElement) => void,
}): PanelCallback<T> {

  return function (operate, value) {
    const id = operate.push(function () {
      const args = useArgs?.()
      renderPanel({
        ...args,
        close() {
          operate.close(id)
        },
        children(size, div) {
          children(operate, id, value, size, div)
        },
        moveFirst() {
          operate.moveToFirst(id)
        },
      })
    })
  }
}
export function normalPanel(
  children: (operate: PanelOperate, id: number) => void,
) {
  const callback = panelWith({
    children
  })
  return function (operate: PanelOperate) {
    callback(operate, null)
  }
}


export const CountContext = createContext(0)





export function usePortalPanel(args: Omit<PanelParams, "portalTarget" | "moveFirst">) {
  const fiber = renderPanel({
    ...args,
    // portalTarget() {
    //   return document.body
    // },
    moveFirst() {
      document.body.appendChild(fiber)
    }
  })
}


export function renderPanelProvider() {
  const { panels, operate } = useRefConst(() => {
    const panels = valueCenterOf<PanelCollection>([])
    const oldSet = panels.set
    panels.set = function (sv) {
      oldSet(sv)
    }
    let uid = 0
    const operate: PanelOperate = {
      push(callback) {
        const id = uid++
        const vs = panels.get()
        panels.set([...vs, { id, callback }])
        return id
      },
      close(id) {
        panels.set(panels.get().filter(v => v.id != id))
      },
      exist(id) {
        return !!panels.get().find(v => v.id == id)
      },
      moveToFirst(id) {
        const vs = panels.get()
        const oldIndex = vs.findIndex(v => v.id == id)
        if (oldIndex > -1 && oldIndex != vs.length - 1) {
          const [old] = vs.splice(oldIndex, 1)
          panels.set([...vs, old])
        }
      }
    }
    return {
      panels,
      operate
    }
  })
  PanelContext.useProvider(operate)
  renderFragment(function () {
    const vs = useStoreTriggerRender(panels)
    renderArray(vs, v => v.id, v => {
      renderFragment(function () {
        v.callback(v.id)
      }, [v.callback, v.id])
    })
  }, [panels])
  return operate
}

