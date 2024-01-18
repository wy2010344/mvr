import { useEffect, useMemo, useModelValue } from "mvr-helper";
import { panelWith } from "../../panel/PanelContext";
import { useRenderCode } from "mvr-dom-helper";
import { initContentEditableModel } from "wy-dom-helper/contentEditable";
import { codeCls } from "../util";
import { renderTree } from "../renderTree";
import { filterInUserToken, tokenize } from "../parse/tokenize";
import { parsePlayground } from "../parse/parsePlayground";
import { dom } from "mvr-dom";
import { evalBody } from "../parse/evalBody";






const saveKey = 'stl2-plaground'
function initModel() {
  return initContentEditableModel(localStorage.getItem(saveKey) || '')
}


export default panelWith(function (operate) {

  return {
    top: useModelValue(300),
    children(size, div) {
      const {
        current,
        renderContent
      } = useRenderCode('', initModel)
      useEffect(() => {
        localStorage.setItem(saveKey, current.value)
      }, [current.value])
      const {
        tokens,
        tree
      } = useMemo(() => {
        const tokens = tokenize(current.value)
        const tree = parsePlayground(tokens.filter(filterInUserToken))
        console.log(tokens, tree)
        return {
          tokens,
          tree
        }
      }, [current])
      renderContent({
        className: codeCls.code
      }, function (div) {
        renderTree(tokens, [])
      })
      dom.button({
        style: `
        display:${tree ? '' : 'none'};
        `,
        onClick() {
          if (tree) {
            const out = evalBody(tree)
            console.log("out", out)
          }
        }
      }).text`执行`
    },
  }
})
