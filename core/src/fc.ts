/**
 * 传统组件变react
 * 不考虑react的异步.
 * 渲染到视图是异步的.
 * 如scrollTop是计算属性,是惰性计算.
 * 所以数据本身是实时的.模型即修改即更新.
 * 但如果计算属性依赖父容器组件等,则要立即render来获得最新的值.相当于flushSync.
 * 
 * 如果挂在类上面,当然计算属性的访问里面有触发flushSync.
 * 如果是函数组件,当然计算属性应该是一种函数,内部触发了flushSync,导致立即更新并计算到最终值.
 * 似乎函数组件仍然会方便很多.
 * 
 * 这种实时与jetpact compose结合?
 */

import { arrayEqual, arrayNotEqualDepsWithEmpty, quote, SetValue, GetValue, simpleEqual } from "wy-helper"
import { Fiber, HookContextCosumer, HookEffect, HookComputed, HookValue, RenderWithDep, VirtaulDomNode, VirtualDomOperator, HookMemo } from "./Fiber"
import { EnvModel } from "./commitWork"
const w = window as any
w.mvr = w.mvr || {}
const mvr = w.mvr as {
  isMemo: boolean
  wipFiber: [EnvModel, Fiber],
  allowWipFiber: boolean
}
mvr.wipFiber = mvr.wipFiber || []
export function useParentFiber() {
  if (mvr.allowWipFiber) {
    return mvr.wipFiber
  }
  console.error('禁止在此处访问fiber')
  throw new Error('禁止在此处访问fiber')
}

export function draftParentFiber(withMemo?: boolean) {
  mvr.allowWipFiber = false
  if (withMemo) {
    mvr.isMemo = true
  }
}
export function revertParentFiber(withMemo?: boolean) {
  mvr.allowWipFiber = true
  if (withMemo) {
    mvr.isMemo = true
  }
}


/**
 * 是否在render期间
 * @param envModel 
 * @returns 
 */
function isOnRender(envModel: EnvModel) {
  if (mvr.allowWipFiber) {
    return mvr.wipFiber[0] == envModel
  }
  return false
}

/**
 * 如果一个过程中获得多处值,会触发多次更新,单独的flushSync能解决,这里却始终是独立的...
 * @param envModel 
 * @returns 
 */
function notRenderRequestFlushSync(envModel: EnvModel) {
  /**
   * 不在render期间,则触发回流
   */
  if (isOnRender(envModel) || mvr.isMemo) {
    return false
  }
  envModel.requestFlushSync()
  return true
}

const hookIndex = {
  state: 0,
  effects: new Map<number, number>(),
  computed: 0,
  memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
  cusomer: 0
}
export function updateFunctionComponent(envModel: EnvModel, fiber: Fiber) {
  revertParentFiber()
  mvr.wipFiber[0] = envModel
  mvr.wipFiber[1] = fiber

  hookIndex.state = 0
  hookIndex.effects.clear()
  hookIndex.computed = 0
  hookIndex.memo = 0

  hookIndex.beforeFiber = undefined

  hookIndex.cusomer = 0
  fiber.render()
  draftParentFiber();
  (mvr.wipFiber as any[]).length = 0
}


type CreateG<T, G> = (get: GetValue<T>, set: SetValue<T>) => G
export function useBaseModel<M, G, T>(initValue: M, createG: CreateG<T, G>, initFun: (v: M) => T): G
export function useBaseModel<T, G>(initValue: T, createG: CreateG<T, G>, initFun?: (v: T) => T): G
/**
 * 一般可简单封装为[value,set,get]用于render
 * @param initValue 
 * @returns 
 */
export function useBaseModel(initValue: any, createG: CreateG<any, any>, initFun = quote) {
  const [envModel, parentFiber] = useParentFiber()
  const isInit = parentFiber.effectTag == "PLACEMENT"
  if (isInit) {
    const hookValues = parentFiber.hookValue || []
    parentFiber.hookValue = hookValues
    const hook: HookValue<any, any> = {
      value: initFun(initValue),
      out: createG(function () {
        return hook.value
      }, function (v) {
        if (v != hook.value) {
          //保持惰性更新
          envModel.requestRender()
          parentFiber.effectTag = "UPDATE"
          hook.value = v
        }
      })
    }
    hookValues.push(hook)
    return hook.out
  } else {
    const hookValues = parentFiber.hookValue
    if (!hookValues) {
      throw new Error("原组件上不存在reducer")
    }
    const hook = hookValues[hookIndex.state]
    hookIndex.state++
    return hook.out
  }
}

export type EffectResult<T> = (void | ((deps: T) => void))
/**
 * 必须有个依赖项,如果没有依赖项,如果组件有useFragment,则会不执行,造成不一致.
 * useMemo如果无依赖,则不需要使用useMemo,但useEffect没有依赖,仍然有意义.有依赖符合幂等,无依赖不需要幂等.
 * @param effect 
 * @param deps 
 */
export function useLevelEffect<T extends readonly any[] = readonly any[]>(
  level: number,
  effect: (args: T, isInit: boolean) => EffectResult<T>, deps: T): void
export function useLevelEffect(
  level: number,
  effect: () => EffectResult<any[]>,
  deps?: readonly any[]): void
export function useLevelEffect(
  level: number,
  effect: any, deps?: any) {
  const [envModel, parentFiber] = useParentFiber()
  const isInit = parentFiber.effectTag == 'PLACEMENT'
  if (isInit) {
    //新增
    const hookEffects = parentFiber.hookEffects || new Map()
    parentFiber.hookEffects = hookEffects
    const hook: HookEffect = {
      deps
    }
    const old = hookEffects.get(level)
    const array = old || []
    if (!old) {
      hookEffects.set(level, array)
    }
    array.push(hook)
    envModel.updateEffect(level, () => {
      hook.destroy = effect(deps, isInit)
    })
  } else {
    const hookEffects = parentFiber.hookEffects
    if (!hookEffects) {
      throw new Error("原组件上不存在hookEffects")
    }
    const index = hookIndex.effects.get(level) || 0
    const levelEffect = hookEffects.get(level)
    if (!levelEffect) {
      throw new Error(`未找到该level effect ${level}`)
    }
    const hook = levelEffect[index]
    if (!hook) {
      throw new Error("出现了更多的effect")
    }
    hookIndex.effects.set(level, index + 1)
    if (arrayNotEqualDepsWithEmpty(hook.deps, deps)) {
      hook.deps = deps
      envModel.updateEffect(level, () => {
        if (hook.destroy) {
          hook.destroy(hook.deps)
        }
        hook.destroy = effect(deps, isInit)
      })
    }
  }
}

export function useBaseMemo<T, V extends readonly any[] = readonly any[]>(
  effect: (deps: V, isInit: boolean) => T,
  deps: V,
): T {
  const [envModel, parentFiber] = useParentFiber()
  const isInit = parentFiber.effectTag == "PLACEMENT"
  if (isInit) {
    const hookMemos = parentFiber.hookMemo || []
    parentFiber.hookMemo = hookMemos

    draftParentFiber(true)
    const state: HookMemo<T, V> = {
      value: effect(deps, isInit),
      deps,
    }
    revertParentFiber(true)
    hookMemos.push(state)
    return state.value
  } else {
    const hookMemos = parentFiber.hookMemo
    if (!hookMemos) {
      throw new Error("原组件上不存在memos")
    }
    const index = hookIndex.memo
    const hook = hookMemos[index]
    if (!hook) {
      throw new Error("出现了更多的memo")
    }
    hookIndex.memo = index + 1
    if (arrayEqual(hook.deps, deps, simpleEqual)) {
      //不处理
      return hook.value
    } else {
      draftParentFiber(true)
      hook.value = effect(deps, isInit)
      hook.deps = deps
      revertParentFiber(true)
      return hook.value
    }
  }
}

export function useBaseComputed<T, G>(
  value: T,
  getG: (value: GetValue<T>) => G
): G {
  const [envModel, parentFiber] = useParentFiber()
  const isInit = parentFiber.effectTag == "PLACEMENT"
  if (isInit) {
    const hookMemos = parentFiber.hookComputed || []
    parentFiber.hookComputed = hookMemos
    const item: HookComputed<T, G> = {
      value,
      getValue: getG(function () {
        notRenderRequestFlushSync(envModel)
        //同步后,获得实时值
        return item.value!
      })
    }
    hookMemos.push(item)
    return item.getValue
  } else {
    const hookMemos = parentFiber.hookComputed
    if (!hookMemos) {
      throw new Error("原组件上不存在memos")
    }
    const index = hookIndex.computed
    const hook = hookMemos[index]
    if (!hook) {
      throw new Error("出现了更多的memo")
    }
    hookIndex.computed = index + 1
    hook.value = value
    return hook.getValue
  }
}

export function renderFiber<T extends readonly any[] = readonly any[]>(
  dom: VirtualDomOperator,
  ...vs: RenderWithDep<T>
): VirtaulDomNode
export function renderFiber<T extends readonly any[] = readonly any[]>(
  dom: void,
  ...vs: RenderWithDep<T>
): void
export function renderFiber(
  dom: any,
  render: any,
  deps?: any
): any {
  const [envModel, parentFiber] = useParentFiber()
  let currentFiber: Fiber
  const isInit = parentFiber.effectTag == 'PLACEMENT'
  if (isInit) {
    //新增
    const vdom = dom ? dom[0](dom[2]) : undefined
    currentFiber = Fiber.create(
      parentFiber,
      vdom,
      {
        render,
        deps
      })
    currentFiber.before = hookIndex.beforeFiber
    //第一次要标记sibling
    if (hookIndex.beforeFiber) {
      hookIndex.beforeFiber.next = (currentFiber)
    } else {
      parentFiber.firstChild = (currentFiber)
    }
    //一直组装到最后
    parentFiber.lastChild = (currentFiber)
    hookIndex.beforeFiber = currentFiber
  } else {
    //修改
    let oldFiber: Fiber | void = undefined
    if (hookIndex.beforeFiber) {
      oldFiber = hookIndex.beforeFiber.next
    }
    if (!oldFiber) {
      oldFiber = parentFiber.firstChild
    }
    if (!oldFiber) {
      throw new Error("非预期地多出现了fiber")
    }
    currentFiber = oldFiber

    hookIndex.beforeFiber = currentFiber
    currentFiber.changeRender(render, deps)
  }
  const currentDom = currentFiber.dom
  if (currentDom) {
    if (!dom) {
      throw new Error('需要更新参数')
    }
    currentDom.useUpdate(dom[1], isInit)
  }
  return currentDom
}

export interface Context<T> {
  useProvider(v: T): void
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): M
  useConsumer(): T
}
export function createContext<T>(v: T): Context<T> {
  return new ContextFactory(v)
}
let contextUid = 0
class ContextFactory<T> implements Context<T>{
  id = contextUid++
  constructor(
    public readonly out: T
  ) {
    this.defaultContext = this.createProvider(out)
  }

  private readonly defaultContext: ContextProvider<T>
  private createProvider(value: T): ContextProvider<T> {
    return new ContextProvider(value, this)
  }
  private createConsumer<M>(
    fiber: Fiber,
    getValue: (v: T) => M,
    shouldUpdate?: (a: M, b: M) => boolean
  ): ContextListener<T, M> {
    return new ContextListener(
      this.findProvider(fiber),
      fiber,
      getValue,
      shouldUpdate
    )
  }
  useProvider(v: T) {
    const [envModel, parentFiber] = useParentFiber()
    const map = parentFiber.contextProvider || new Map()
    parentFiber.contextProvider = map
    let hook = map.get(this)
    if (!hook) {
      hook = this.createProvider(v)
      map.set(this, hook)
    }
    hook.changeValue(v)
  }
  /**
   * @param getValue 
   * @param shouldUpdate 
   * @returns 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => any): M {
    const [envModel, parentFiber] = useParentFiber()
    const isInit = parentFiber.effectTag == "PLACEMENT"
    if (isInit) {
      const hookConsumers = parentFiber.hookContextCosumer || []
      parentFiber.hookContextCosumer = hookConsumers

      const hook: HookContextCosumer<T, M> = this.createConsumer(parentFiber, getValue, shouldUpdate)
      hookConsumers.push(hook)
      return hook.value
    } else {
      const hookConsumers = parentFiber.hookContextCosumer
      if (!hookConsumers) {
        throw new Error("原组件上不存在hookConsumers")
      }
      const index = hookIndex.cusomer
      const hook = hookConsumers[index]
      if (!hook) {
        throw new Error("没有出现更多consumes")
      }
      if (hook.select != getValue) {
        console.warn("useSelector的select变化")
      }
      if (hook.shouldUpdate != shouldUpdate) {
        console.warn("useSelector的shouldUpdate变化")
      }
      hookIndex.cusomer = index + 1
      return hook.value
    }
  }
  useConsumer() {
    return this.useSelector(quote)
  }
  private findProvider(_fiber: Fiber) {
    let fiber = _fiber as Fiber | undefined
    while (fiber) {
      if (fiber.contextProvider) {
        const providers = fiber.contextProvider
        if (providers.has(this)) {
          return providers.get(this) as ContextProvider<T>
        }
      }
      fiber = fiber.parent
    }
    return this.defaultContext
  }
}
class ContextProvider<T>{
  constructor(
    public value: T,
    public parent: ContextFactory<T>
  ) { }
  changeValue(v: T) {
    if (this.value != v) {
      this.value = v
      this.notify()
    }
  }
  notify() {
    this.list.forEach(row => row.change())
  }
  private list = new Set<ContextListener<T, any>>()
  on(fun: ContextListener<T, any>) {
    if (this.list.has(fun)) {
      console.warn("已经存在相应函数", fun)
    } else {
      this.list.add(fun)
    }
  }
  off(fun: ContextListener<T, any>) {
    if (!this.list.delete(fun)) {
      console.warn("重复删除context", fun)
      //throw new Error('重复删除debug')
    }
  }
}

class ContextListener<T, M>{
  constructor(
    public context: ContextProvider<T>,
    private fiber: Fiber,
    public select: (v: T) => M,
    public shouldUpdate?: (a: M, b: M) => boolean
  ) {
    this.context.on(this)
    this.value = this.getFilberValue()
  }
  public value: M
  private getFilberValue() {
    draftParentFiber()
    const v = this.select(this.context.value)
    revertParentFiber()
    return v
  }
  change() {
    const newValue = this.getFilberValue()
    if (newValue != this.value && this.didShouldUpdate(newValue, this.value)) {
      this.value = newValue
      //即使子节点没有展开函数,也会触发到
      this.fiber.effectTag = "UPDATE"
    }
  }
  didShouldUpdate(a: M, b: M) {
    if (this.shouldUpdate) {
      draftParentFiber()
      const v = this.shouldUpdate(a, b)
      revertParentFiber()
      return v
    } else {
      return true
    }
  }
  destroy() {
    this.context.off(this)
  }
}