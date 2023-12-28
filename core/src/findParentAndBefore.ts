import { Fiber, VirtaulDomNode } from "./Fiber";
export type FindParentAndBefore = [VirtaulDomNode, VirtaulDomNode | null] | [VirtaulDomNode | null, VirtaulDomNode] | null
/**
 * 如果在render阶段确定,当然比较符号imgUI.
 * 如果在最后定义,在当前,比较节省性能
 * ——这是仅属于dom的fiber
 * @param fiber 
 */


export function findParentAndBefore(fiber: Fiber) {
  const dom = fiber.dom
  if (dom) {
    if (dom.isPortal) {
      //自己去处理
      return
    }
    const parentBefore = getBeforeOrParent(fiber)
    if (parentBefore) {
      dom.appendAfter(parentBefore)
    } else {
      //console.error("未找到", fiber.dom)
    }
  }
}
function getBeforeOrParent(fiber: Fiber) {
  const prevData = fiber.before
  return prevData
    ? getCurrentBefore(prevData)
    : findParentBefore(fiber)
}

function getCurrentBefore(fiber: Fiber): FindParentAndBefore {
  const dom = fiber.dom
  if (dom) {
    if (dom.isPortal) {
      //不进入遍历,向前走一个
      return getBeforeOrParent(fiber)
    } else {
      return [getParentDomFilber(fiber).dom!, dom]
    }
  }
  const lastChild = fiber.lastChild
  if (lastChild) {
    //在子节点中寻找
    const dom = getCurrentBefore(lastChild)
    if (dom) {
      return dom
    }
  }
  const prev = fiber.before
  if (prev) {
    //在兄节点中找
    const dom = getCurrentBefore(prev)
    if (dom) {
      return dom
    }
  }
  return findParentBefore(fiber)
}


function findParentBefore(fiber: Fiber): FindParentAndBefore {
  const parent = fiber.parent
  if (parent) {
    const dom = parent.dom
    if (dom) {
      //找到父节点，且父节点是有dom的
      return [dom, null]
    }
    const prev = parent.before
    if (prev) {
      //在父的兄节点中寻找
      const dom = getCurrentBefore(prev)
      if (dom) {
        return dom
      }
    }
    return findParentBefore(parent)
  }
  return null
}

function getParentDomFilber(fiber: Fiber) {
  let domParentFiber = fiber.parent
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent
  }
  return domParentFiber
}


export function deepTravelFiber<T extends any[]>(call: (Fiber: Fiber, ...vs: T) => void) {
  return function (fiber: Fiber, ...vs: T) {
    call(fiber, ...vs)
    const child = fiber.firstChild
    if (child) {
      return child
    }
    /**寻找叔叔节点 */
    let nextFiber: Fiber | undefined = fiber
    while (nextFiber) {
      const next = nextFiber.next
      if (next) {
        return next
      }
      nextFiber = nextFiber.parent
    }
    return undefined
  }
}