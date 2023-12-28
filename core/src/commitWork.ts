import { deepTravelFiber, findParentAndBefore } from "./findParentAndBefore";
import { Fiber, VirtaulDomNode } from "./Fiber";
import { Reconcile } from "./reconcile";
import { EmptyFun, iterableToList, run } from "wy-helper";


export interface TimeWork {
  (): void
  isRender?: boolean
}
export type GetAstNextTimeWork = (
  fun: () => TimeWork
) => EmptyFun

export class EnvModel {
  constructor(
    private reconcile: Reconcile
  ) { }
  requestFlushSync() {
    this.reconcile.requestFlushSync()
  }
  requestRender() {
    this.reconcile.requestRender(this)
  }
  /**本次等待删除的fiber*/
  private readonly deletions: Fiber[] = []
  addDelect(fiber: Fiber) {
    this.deletions.push(fiber)
  }
  private updateEffects = new Map<number, EmptyFun[]>()
  updateEffect(level: number, set: EmptyFun) {
    const old = this.updateEffects.get(level)
    const array = old || []
    if (!old) {
      this.updateEffects.set(level, array)
    }
    array.push(set)
  }
  commit(rootFiber: Fiber) {
    this.deletions.forEach(function (fiber) {
      //清理effect
      notifyDel(fiber)
      //删除
      commitDeletion(fiber)
    })
    this.deletions.length = 0
    updateFixDom(rootFiber)

    //执行所有effect
    const updateEffects = this.updateEffects
    const keys = iterableToList(updateEffects.keys()).sort()
    for (const key of keys) {
      updateEffects.get(key)?.forEach(run)
    }
    updateEffects.clear()
  }
}


function updateFixDom(fiber: Fiber | undefined) {
  while (fiber) {
    fiber = fixDomAppend(fiber)
  }
}
const fixDomAppend = deepTravelFiber(findParentAndBefore)



export type FindParentAndBefore = [VirtaulDomNode, VirtaulDomNode | null] | [VirtaulDomNode | null, VirtaulDomNode] | null
/**
 * portal内的节点不会找到portal外，portal外的节点不会找到portal内。
 * 即向前遍历，如果该节点是portal，跳过再向前
 * 向上遍历，如果该节点是portal，不再向上---本来不会再向上。
 * @param fiber 
 * @returns 
 */


/**
 * 需要一直找到具有dom节点的子项
 * @param fiber 
 * @param domParent 
 */
function commitDeletion(fiber: Fiber) {
  const dom = fiber.dom
  if (dom) {
    if (!dom.isPortal) {
      //portal自己在destroy里移除
      dom.removeFromParent()
    }
  } else {
    circleCommitDelection(fiber.firstChild)
  }
}
function circleCommitDelection(fiber: Fiber | void) {
  if (fiber) {
    commitDeletion(fiber)
    circleCommitDelection(fiber.next)
  }
}

function notifyDel(fiber: Fiber) {
  destroyFiber(fiber)
  const child = fiber.firstChild
  if (child) {
    let next: Fiber | void = child
    while (next) {
      notifyDel(next)
      next = next.next
    }
  }
}
function destroyFiber(fiber: Fiber) {
  fiber.destroyed = true
  const effects = fiber.hookEffects
  if (effects) {
    const keys = iterableToList(effects.keys()).sort()
    for (const key of keys) {
      effects.get(key)?.forEach(effect => {
        const state = effect
        const destroy = state.destroy
        if (destroy) {
          destroy(state.deps)
        }
      })
    }
  }
  const listeners = fiber.hookContextCosumer
  listeners?.forEach(listener => {
    listener.destroy()
  })
  fiber.dom?.destroy()
}
