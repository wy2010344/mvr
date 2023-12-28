import { emptyArray, getTheEmptyArray } from "wy-helper"
import { useAttrEffect, useEffect } from "mvr-helper"
import { CSSParamType, CssNest, createBodyStyleTag, genCSS, genCssMap } from "wy-dom-helper"
import { useComputed } from "mvr-core"

/**
 * 单个css,动态变化
 * @param ts 
 * @param vs 
 * @returns 
 */
export function useCss(ts: TemplateStringsArray, ...vs: CSSParamType[]) {
  const css = genCSS(ts, vs)
  return useCssMap(css)
}
function useDeleteStyle(style: HTMLStyleElement) {
  useEffect(() => {
    return function () {
      style.remove()
    }
  }, emptyArray)
}
export function useCssMap<T extends CssNest>(map: T, split?: string) {
  const style = useComputed(createBodyStyleTag, getTheEmptyArray)()
  const { css, classMap } = genCssMap(map, style.id, split)
  useAttrEffect(() => {
    style.textContent = css
  }, [css])
  useDeleteStyle(style)
  return classMap
}