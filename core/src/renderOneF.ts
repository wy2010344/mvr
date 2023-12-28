import { getTheEmptyArray } from "wy-helper";
import { draftParentFiber, renderFiber, revertParentFiber, useComputed, useParentFiber } from "./fc";
import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber";
////////****single****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type OneProps<T extends readonly any[] = readonly any[]> = readonly [
  any,
  VirtaulDomNode | undefined,
  (deps: T) => void,
  T
] | readonly [any,
  VirtaulDomNode | undefined,
  () => void]

function initCache() {
  return {} as {
    key?: any,
    fiber?: Fiber
  }
}
export function renderOneF<M>(
  dom: VirtualDomOperator,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
): VirtaulDomNode
export function renderOneF<M>(
  dom: void,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
): void
export function renderOneF<M>(
  dom: any,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
) {
  return renderFiber(dom, function () {
    draftParentFiber()
    const [key, dom, render, deps] = outRender(data)
    revertParentFiber()

    let commitWork: (() => void) | void = undefined
    const [envModel, parentFiber] = useParentFiber()
    const cache = useComputed(initCache, getTheEmptyArray)()
    if (cache.key == key && cache.fiber) {
      //key相同复用
      cache.fiber.changeRender(render as any, deps)
    } else {
      //删旧增新
      if (cache.fiber) {
        //节点存在
        envModel.addDelect(cache.fiber)
      }
      const placeFiber = Fiber.create(parentFiber, dom, { render, deps })
      commitWork = () => {
        cache.key = key
        cache.fiber = placeFiber
      }
      //只有一个节点,故是同一个
      parentFiber.lastChild = (placeFiber)
      parentFiber.firstChild = (placeFiber)
    }

    //因为没有圆滚了,所以不再需要
    if (commitWork) {
      commitWork()
    }
  }, outDeps!)
}