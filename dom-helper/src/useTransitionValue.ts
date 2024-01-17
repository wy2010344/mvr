import { EmptyFun } from "wy-helper"
import { useEffect, useModelState, useModelValue } from 'mvr-helper'
import { CSSProperties, forceFlow, forceFlowClassNames, forceFlowInitClassNames, forceFlowInitStyle, forceFlowStyle, mergeStyle, requestBatchAnimationFrame } from "wy-dom-helper"


type Getter<T> = (...vs: any[]) => T
/**
 * 这个模仿react-transition-group的并不科学
 * 过渡有准备动作?
 * 事实上hover无准备动作
 * 最多多了一个will-change
 * 
 * 
 * 三态的科学性:
 * 初始态
 * 进入态
 * 退出态
 * 
 * 四态的问题——本质上是两态,主要是针对css动画
 * 基础态+动画目标态.样式只用于动画,不记录为状态
 * 因此动画结束,可能需要删除造成动画的样式
 * 然后手动设置样式
 */
export function useInitClassNames(
  ref: () => Element,
  initCls: string,
  showCls: string,
) {
  return useTriggerClassNames(ref, false, {
    willShow: initCls,
    show: showCls,
    exit: initCls
  })
}

export function useTriggerClassNames(
  ref: () => Element,
  exiting: any,
  config: {
    willShow: string
    show: string
    willExit?: string
    exit: string
  },
  effect?: () => void | EmptyFun
) {
  useEffect(() => {
    const div = ref()
    if (exiting) {
      if (config.willExit) {
        forceFlowInitClassNames(div, config.willExit, config.exit)
      } else {
        forceFlowClassNames(div, config.exit)
      }
    } else {
      forceFlowInitClassNames(div, config.willShow, config.show)
    }
    return effect?.()
  }, [!exiting])
  return exiting ? config.exit : config.show
}

export function useTriggerClassNamesWithShow(
  ref: () => Element,
  exiting: any,
  config: {
    willShow: string
    show: string
    willExit?: string
    exit: string
  },
  resolve: EmptyFun,
  timeout: number,
  show?: string
) {
  const state = useModelValue<string>()
  const cls = useTriggerClassNames(ref, exiting, config, function () {
    return subscribeTimeout(show ? function () {
      resolve()
      state.value = show
    } : resolve, timeout)
  })
  if (exiting) {
    return cls
  } else {
    return state || cls
  }
}
export type TriggerStyleConfig = {
  willShow: CSSProperties
  show: CSSProperties
  showReplace?(div: ElementCSSInlineStyle & Element, style: CSSProperties): CSSProperties
  willExit?: CSSProperties
  willExitReplace?(div: ElementCSSInlineStyle & Element, style: CSSProperties): CSSProperties
  exit: CSSProperties
}
export function useTriggerStyle(
  ref: () => ElementCSSInlineStyle & Element,
  exiting: any,
  config: TriggerStyleConfig,
  effect?: (exiting: any) => void
) {
  useEffect(() => {
    const div = ref()
    if (exiting) {
      const replace = config.willExitReplace || config.showReplace
      if (config.willExit || replace) {
        forceFlowInitStyle(div, config.willExit || config.show, config.exit, replace)
      } else {
        forceFlowStyle(div, config.exit)
      }
    } else {
      const replaceShow = config.showReplace?.(div, config.show) || config.show
      forceFlowInitStyle(div, config.willShow, replaceShow)
    }
    return effect?.(exiting)
  }, [!exiting])
  return exiting ? config.exit : config.show
}

export function useTriggerStyleWithShow(
  ref: () => ElementCSSInlineStyle & Element,
  exiting: any,
  config: TriggerStyleConfig,
  resolve: EmptyFun,
  timeout: number,
  show?: CSSProperties
) {
  const state = useModelValue<CSSProperties>()
  const cls = useTriggerStyle(ref, exiting, config, function (exiting) {
    return subscribeTimeout(function () {
      resolve()
      if (!exiting && config.showReplace) {
        mergeStyle(ref(), config.show)
      }
      if (show) {
        state.value = show
      }
    }, timeout)
  })
  if (exiting) {
    return cls
  } else {
    return state || cls
  }
}


/**
 * 有这样的一种可能,进入动画并未完成,但变成退出了,此时绑定了退出动画事件,此时退出事件被进入动画的事件处理到
 * @param ref 
 * @param callback 
 * @param deps 
 */
export function useBindTransitionFinish(
  ref: () => HTMLElement,
  callback: EmptyFun,
  deps?: readonly any[]
) {
  useEffect(function () {
    const div = ref()
    requestBatchAnimationFrame(function () {
      div.addEventListener("transitionend", callback, {
        once: true
      })
      div.addEventListener("transitioncancel", callback, {
        once: true
      })
    })
    return function () {
      div.removeEventListener("transitionend", callback)
      div.removeEventListener("transitioncancel", callback)
    }
  }, deps)
}
export function useBindAnimationFinish(
  ref: () => HTMLElement,
  callback: EmptyFun,
  deps?: readonly any[]
) {
  useEffect(function () {
    const div = ref()
    requestBatchAnimationFrame(function () {
      div.addEventListener("animationend", callback, {
        once: true
      })
      div.addEventListener("animationcancel", callback, {
        once: true
      })
    })
    return function () {
      div.removeEventListener("animationend", callback)
      div.removeEventListener("animationcancel", callback)
    }
  }, deps)
}
/**
 * 需要exitDone,因为如果到时间仍未删除,需要exitDone占位
 */
export type LifeTransState = "init" | "enter" | "show" | "willExit" | "exit"

type LifeStateArg = {
  ref?: Getter<HTMLElement | null | undefined>,
  resolve?: EmptyFun
  /**只处理enter */
  disabled?: boolean
  noShowChange?: boolean
}
const defaultLifeStateArg: LifeStateArg = {}

/**
 * exiting默认是true.
 * @param exiting 
 * @param ref 
 * @param resolve 
 * @returns 
 */
export function useLifeState(
  exiting: any,
  arg: LifeStateArg = defaultLifeStateArg
) {
  const [state, setState] = useModelState<LifeTransState>(arg.disabled ? 'show' : 'init')
  useEffect(() => {
    if (exiting) {
      setState('exit')
    } else {
      if (arg.disabled) {
        return
      }
      setState('enter')
    }
    if (arg.ref) {
      forceFlow(arg.ref())
    }
  }, [!exiting])
  return [exiting && state != 'exit' ? 'willExit' : state, function () {
    if (state == 'enter') {
      if (arg.noShowChange || arg.disabled) {
        return
      }
      setState('show')
    }
    arg.resolve?.()
  }] as const
}

function subscribeTimeout(callback: EmptyFun, time: number) {
  /**
   * 需要取消订阅,因为开发者模式useEffect执行多次,不取消会造成问题
   */
  const inv = setTimeout(callback, time)
  return function () {
    clearTimeout(inv)
  }
}
export function useLifeStateTime(
  exiting: any,
  timeout: number | {
    enter: number
    exit: number
  },
  arg: LifeStateArg = defaultLifeStateArg
) {
  const [state, resolve] = useLifeState(exiting, arg)
  useEffect(() => {
    if (state == 'enter') {
      return subscribeTimeout(resolve, typeof timeout == 'number' ? timeout : timeout.enter)
    } else if (state == 'exit') {
      return subscribeTimeout(resolve, typeof timeout == 'number' ? timeout : timeout.exit)
    }
  }, [state])
  return state
}

export function useLifeStateTransition(
  exiting: any,
  arg: LifeStateArg = defaultLifeStateArg
) {
  const [state, resolve] = useLifeState(exiting, arg)
  useEffect(() => {
    const div = arg.ref?.()
    if (div) {
      if (state == 'enter' || state == 'exit') {
        requestBatchAnimationFrame(function () {
          //好像加个时延迟注册要靠谱一些,不然会被之前的动画冲掉
          div.addEventListener("transitionend", resolve, {
            once: true
          })
          div.addEventListener("transitioncancel", resolve, {
            once: true
          })
        })
        return function () {
          div.removeEventListener("transitionend", resolve)
          div.removeEventListener("transitioncancel", resolve)
        }
      }
    }
  }, [state])
  return state
}

export type LiftStateModel<T> = {
  init: T
  enter: T
  show?: T | boolean
  willExit?: T | boolean
  exit: T
}

export function getLifeState<T>(model: LiftStateModel<T>, state: LifeTransState) {
  if (state == 'init' || state == 'enter' || state == 'exit') {
    return model[state]
  } else if (state == 'willExit') {
    const v = model[state]
    if (typeof v == 'string') {
      return v
    }
  }
  const v = model['show']
  if (typeof v == 'string') {
    return v
  }
  return model['enter']
}