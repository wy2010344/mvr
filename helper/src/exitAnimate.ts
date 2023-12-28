import { useAtomFun } from "./useRef"
import { useVersion } from "./useVersion"
import { ArrayHelper, createEmptyArray, emptyArray, getOutResolvePromise } from "wy-helper"
import { renderArray } from "./renderMap"
import { useEffect } from "./useEffect"

export interface ExitModel<V> {
  key: Promise<any>
  value: V
  originalKey: any
  enterIgnore?: boolean
  exiting?: boolean
  promise: Promise<any>
  resolve(v?: any): void
}

interface ExitModelImpl<V> extends ExitModel<V> {
  hide?: boolean | ExitModel<V>
}



/**
 * 主要是有一点,可能会回退
 */
export type ExitAnimateMode = 'pop' | 'shift'

export type ExitAnimateArg<V> = {
  mode?: ExitAnimateMode
  wait?: 'in-out' | 'out-in'
  exitIgnore?(v: V): any
  enterIgnore?(v: V): boolean
  onExitComplete?(v?: any): void
  onEnterComplete?(v?: any): void
  onAnimateComplete?(v?: any): void
}

export function useRenderExitAnimate<V>(
  list: readonly V[],
  getKey: (v: V) => any,
  {
    mode = 'shift',
    wait,
    exitIgnore,
    onExitComplete,
    onEnterComplete,
    enterIgnore,
    onAnimateComplete
  }: ExitAnimateArg<V>
) {
  //用于删除后强制刷新
  const [_, updateVersion] = useVersion()
  //每次render进来,合并cacheList,因为有回滚与副作用,所以必须保持所有变量的无副作用
  const cacheList = useAtomFun<ExitModelImpl<V>[]>(createEmptyArray)
  const newCacheList = new ArrayHelper(cacheList.get())
  const thisAddList: ExitModelImpl<V>[] = []
  const thisRemoveList: ExitModelImpl<V>[] = []

  newCacheList.forEachRight(function (old, i) {
    if (!old.exiting && !list.some(v => getKey(v) == old.originalKey)) {
      //新删除了
      if (exitIgnore?.(old.value)) {
        newCacheList.removeAt(i)
      } else {
        const [promise, resolve] = getOutResolvePromise()
        const cache: ExitModelImpl<V> = {
          ...old,
          exiting: true,
          promise,
          resolve,
          hide: old
        }
        newCacheList.replace(i, cache)
        thisRemoveList.push(cache)
        promise.then(function () {
          const eCacheList = new ArrayHelper(cacheList.get())
          const n = eCacheList.removeWhere(old => old.key == cache.key)
          if (n) {
            updateVersion()
            cacheList.set(eCacheList.get() as ExitModelImpl<V>[])
          }
        })
      }
    }
  })
  let nextIndex = 0
  for (const v of list) {
    const key = getKey(v)
    const oldIndex = newCacheList.get().findIndex(old => !old.exiting && old.originalKey == key)
    if (oldIndex < 0) {
      if (mode == 'shift') {
        while (newCacheList.get()[nextIndex]?.exiting) {
          nextIndex++
        }
      }
      const [promise, resolve] = getOutResolvePromise()
      const cache: ExitModelImpl<V> = {
        key: promise,
        value: v,
        originalKey: key,
        hide: wait == 'out-in' && thisRemoveList.length != 0,
        enterIgnore: enterIgnore?.(v),
        promise,
        resolve
      }
      newCacheList.insert(nextIndex, cache)
      thisAddList.push(cache)
    } else {
      newCacheList.replace(oldIndex, {
        ...newCacheList.get()[oldIndex],
        value: v
      })
      nextIndex = oldIndex + 1
    }
  }
  if (!(thisAddList.length && wait == 'in-out')) {
    thisRemoveList.forEach(row => row.hide = false)
  }

  useEffect(() => {
    const removePromiseList: Promise<any>[] = thisRemoveList.map(v => v.promise)

    if (removePromiseList.length) {
      const allDestroyPromise = Promise.all(removePromiseList)
      if (onExitComplete) {
        allDestroyPromise.then(onExitComplete)
      }
      const onExitWait = wait == 'out-in' && thisAddList.length != 0
      if (onExitWait) {
        allDestroyPromise.then(function () {
          //将本次更新全部标记为展示.
          const eCacheList = new ArrayHelper(cacheList.get())
          let n = 0
          eCacheList.forEach(function (cache, x) {
            if (cache.hide) {
              const row = thisAddList.find(v => v.key == cache.key)
              if (row) {
                eCacheList.replace(x, {
                  ...cache,
                  hide: false
                })
                n++
              }
            }
          })
          if (n) {
            updateVersion()
            cacheList.set(eCacheList.get() as ExitModelImpl<V>[])
          }
        })
      }
    }
    const addPromiseList: Promise<any>[] = []
    for (const thisAdd of thisAddList) {
      if (!enterIgnore?.(thisAdd.value)) {
        addPromiseList.push(thisAdd.promise)
      }
    }
    if (addPromiseList.length) {
      const allEnterPromise = Promise.all(addPromiseList)
      if (onEnterComplete) {
        allEnterPromise.then(onEnterComplete)
      }
      const onEnterWait = wait == 'in-out' && thisRemoveList.length != 0
      if (onEnterWait) {
        allEnterPromise.then(function () {
          //将本次更新全部标记为展示.
          const eCacheList = new ArrayHelper(cacheList.get())
          let n = 0
          eCacheList.forEach(function (cache, x) {
            if (cache.hide) {
              const row = thisRemoveList.find(v => v.key == cache.key)
              if (row) {
                eCacheList.replace(x, {
                  ...cache,
                  hide: false
                })
                n++
              }
            }
          })
          if (n) {
            updateVersion()
            cacheList.set(eCacheList.get() as ExitModelImpl<V>[])
          }
        })
      }
    }
    if (onAnimateComplete && (addPromiseList.length || removePromiseList.length)) {
      Promise.all([...addPromiseList, ...removePromiseList]).then(onAnimateComplete)
    }
    cacheList.set(newCacheList.get() as ExitModelImpl<V>[])
  })
  return newCacheList.get().map(getHideAsShow).filter(getNotHide)
}

export function renderExitAnimate<V>(
  list: readonly V[],
  getKey: (v: V) => any,
  args: ExitAnimateArg<V>,
  render: (v: ExitModel<V>) => void
) {
  const newList = useRenderExitAnimate(list, getKey, args)
  renderArray(newList, getKen, function (value) {
    render(value)
  })
}

function getNotHide(v: ExitModelImpl<any>) {
  return !v.hide
}
function getHideAsShow(v: ExitModelImpl<any>) {
  if (v.hide && v.exiting && typeof v.hide == 'object') {
    return {
      ...v,
      ...v.hide,
      exiting: false
    }
  }
  return v
}
function getKen<V>(v: ExitModel<V>) {
  return v.key
}

function onlyGetArray(v: any) {
  return v
}
function ignoreTrue() {
  return true
}


const onlyArray = [1]
/**
 * 只有一个元素的
 */
export function renderOneExitAnimate(
  show: any,
  {
    ignore,
    ...args
  }: {
    ignore?: boolean
    onAnimateComplete?(): void
  },
  render: (v: ExitModel<any>) => void
) {
  renderExitAnimate(
    show ? onlyArray : emptyArray,
    onlyGetArray,
    {
      enterIgnore: show && ignore ? ignoreTrue : undefined,
      exitIgnore: !show && ignore ? ignoreTrue : undefined,
      ...args
    },
    render
  )
}