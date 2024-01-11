import { emptyArray, getTheEmptyArray, quote, storeRef } from "wy-helper";
import { draftParentFiber, renderFiber, revertParentFiber, useBaseComputed, useBaseMemo, useParentFiber } from "./fc";
import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber";
////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type MapRowRender<C, T extends any[]> = readonly [
  C,
  any,
  VirtaulDomNode | undefined,
  (v: T) => void,
  T,
] | readonly [
  C,
  any,
  VirtaulDomNode | undefined,
  () => void
]
function createMapRef() {
  return storeRef(new Map<any, Fiber[]>())
}

/**
 * 最大兼容优化,减少过程中的声明
 * @param data 
 * @param translate 
 * @param render 
 * @param deps 
 */
export function renderMapF<M, C>(
  dom: VirtualDomOperator,
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  /**中间不允许hooks,应该处理一下*/
  render: (v: M, c: C) => MapRowRender<C, any>,
  deps?: readonly any[]
): VirtaulDomNode
export function renderMapF<M, C>(
  dom: void,
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  /**中间不允许hooks,应该处理一下*/
  render: (row: M, c: C) => MapRowRender<C, any>,
  deps?: readonly any[]
): void
export function renderMapF<M, C>(
  dom: any,
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  /**中间不允许hooks,应该处理一下*/
  render: (row: M, c: C) => MapRowRender<C, any>,
  deps?: readonly any[]
) {
  return renderFiber(dom, function () {
    const mapRef = useBaseMemo(createMapRef, emptyArray)
    const oldMap = cloneMap(mapRef.get())
    const newMap = new Map<any, Fiber[]>()

    const [envModel, parentFiber] = useParentFiber()

    let beforeFiber: Fiber | undefined = undefined
    //提前置空
    parentFiber.firstChild = (undefined!)
    parentFiber.lastChild = (undefined!)


    let cache = initCache
    while (hasValue(data, cache)) {
      draftParentFiber()
      const [nextCache, key, dom, rowRender, deps] = render(data, cache)
      cache = nextCache
      revertParentFiber()

      const oldFibers = oldMap.get(key)
      let oldFiber = oldFibers?.[0]
      if (oldFiber) {
        //因为新排序了,必须产生draft用于排序,
        oldFiber.changeRender(rowRender, deps)
        oldFiber.before = (beforeFiber)
        oldFibers?.shift()
      } else {
        const tempFiber = Fiber.create(
          parentFiber,
          dom,
          {
            render: rowRender,
            deps
          })
        tempFiber.before = (beforeFiber!)
        oldFiber = tempFiber
      }
      const newFibers = newMap.get(key) || []
      if (newFibers.length > 0) {
        console.warn(`重复的key---重复${newFibers.length}次数`, key)
      }
      newFibers.push(oldFiber)
      newMap.set(key, newFibers)

      //构建双向树
      if (beforeFiber) {
        beforeFiber.next = (oldFiber)
      } else {
        parentFiber.firstChild = (oldFiber)
      }
      parentFiber.lastChild = (oldFiber)
      oldFiber.next = (undefined)

      beforeFiber = oldFiber
    }
    for (const olds of oldMap.values()) {
      for (const old of olds) {
        //需要清理,以保证不会删除错误
        old.before = (undefined)
        old.next = (undefined)
        envModel.addDelect(old)
      }
    }
    //并不需要最后执行了,可以处理完后立即执行,因为已经没有回滚了
    mapRef.set(newMap)
  }, deps!)
}

export function cloneMap<T>(map: Map<any, T[]>) {
  const newMap = new Map<any, T[]>()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
  })
  return newMap
}