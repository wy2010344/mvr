import { EnvModel, GetAstNextTimeWork } from "./commitWork";
import { Fiber, VirtaulDomNode } from "./Fiber";
import { Reconcile } from "./reconcile";
export type { EffectResult } from './fc'
export type { GetAstNextTimeWork, FindParentAndBefore } from './commitWork'
export { useLevelEffect, useBaseComputed, useBaseModel, createContext, renderFiber, useBaseMemo } from './fc'
export * from './renderMapF'
export * from './renderOneF'
export type {
  RenderWithDep,
  VirtaulDomNode,
  VirtualDomOperator,
} from './Fiber'
export function render<T>(
  dom: VirtaulDomNode<T>,
  render: () => void,
  getAsk: GetAstNextTimeWork
) {
  const rootFiber = Fiber.create(null!, dom, {
    render
  })
  const reconcile = new Reconcile(rootFiber, getAsk)
  const envModel = new EnvModel(reconcile)
  envModel.requestRender()
  return function () {
    reconcile.destroy(envModel)
  }
}