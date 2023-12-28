import { renderMapF } from "mvr-core"


export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export function arrayHasValue(m: ReadArray<any>, i: number) {
  return i < m.length
}


export function createRenderMapF<M, C>(
  hasValue: (v: M, c: C) => any,
  getNext: (v: M, c: C) => C,
  getKey: (v: M, c: C) => any,
) {
  return function (data: M, initCache: C, render: (v: M, c: C) => void) {
    return renderMapF(undefined, data, initCache, hasValue, function (row, c) {
      return [getNext(row, c), getKey(row, c), undefined, function () {
        render(row, c)
      }]
    })
  }
}

export function renderArray<T>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void
) {
  renderMapF(undefined, vs, 0 as number, arrayHasValue, function (data, i) {
    const row = data[i]
    return [i + 1, getKey(row, i), undefined, function () {
      render(row, i)
    }]
  })
}

export function createRenderArray<T>(
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void
): (vs: ReadArray<T>) => void
export function createRenderArray<T>(getKey: (v: T, i: number) => any): (vs: ReadArray<T>, render: (v: T, i: number) => void) => void
export function createRenderArray(getKey: any, superRender?: any) {
  return function (vs: ReadArray<any>, render = superRender) {
    return renderArray(vs, getKey, render)
  }
}


export const renderArrayWithIndexAsKey = createRenderArray(function <T>(_: T, i: number) {
  return i
})

function iterableHasValue<T>(m: IterableIterator<T>, v: IteratorResult<T, any>) {
  return !v.done
}

export function renderIterableIterator<V>(
  iterable: IterableIterator<V>,
  getKey: (value: V) => any,
  render: (value: V) => void
) {
  renderMapF(undefined, iterable, iterable.next(), iterableHasValue, function (iterable, i) {
    return [iterable.next(), getKey(i.value), undefined, function () {
      return render(i.value)
    }]
  })
}


export function createRenderIterableIterator<V>(
  getKey: (value: V) => any,
  render: (value: V) => void
): (iterable: IterableIterator<V>) => void
export function createRenderIterableIterator<V>(
  getKey: (value: V) => any
): (
  vs: IterableIterator<V>,
  render: (value: V
  ) => void) => void
export function createRenderIterableIterator(getKey: any, superRender?: any) {
  return function (vs: IterableIterator<any>, render = superRender) {
    return renderIterableIterator(vs, getKey, render)
  }
}



function getMapEntityKey<K, V>(kv: [K, V]) {
  return kv[0]
}

export function renderMap<K, V>(
  map: Map<K, V>,
  render: (value: V, key: K) => void
) {
  renderIterableIterator(map.entries(), getMapEntityKey, function (row) {
    render(row[1], row[0])
  })
}

export function renderSet<V>(
  set: Set<V>,
  render: (value: V) => void
) {
  renderIterableIterator(set.entries(), getMapEntityKey, function (row) {
    render(row[0])
  })
}

export function renderObject<V>(
  object: {
    [key: string]: V
  },
  render: (value: V, key: string) => void
) {
  renderArray(Object.entries(object), getMapEntityKey, function (row) {
    render(row[1], row[0])
  })
}