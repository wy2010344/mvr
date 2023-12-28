import { renderOneF } from "mvr-core"

export function renderOne<T>(key: T, render: (v: T) => void) {
  renderOneF(undefined, key, function (key) {
    return [key, undefined, function () {
      render(key)
    }]
  })
}