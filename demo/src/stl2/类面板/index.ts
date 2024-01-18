import { RWValue, emptyArray } from "wy-helper";
import { modelListStore, modelStore } from "../model";
import { dom } from "mvr-dom";
import { panelWith } from "../../panel/PanelContext";
import { renderArray, renderIf, renderOne, useBuildSubSetObject, useMemo, useModelValue, useStoreValue } from "mvr-helper";
import { renderInput, useRenderCode } from "mvr-dom-helper";
import { cns, cssMap } from "wy-dom-helper";
import { filterInUserToken, tokenize } from "../parse/tokenize";
import { parseMethod } from "../parse/parseMethod";
import { initContentEditableModel } from "wy-dom-helper/contentEditable";
import { renderTree } from "../renderTree";
import { codeCls } from "../util";
import { parseInit } from "../parse/parseInit";

export default panelWith<{
  name: string
  left: number
  top: number
}>(function (operate, id, {
  name, left, top
}) {
  return {
    title() {
      dom.span().text`${name}`
    },
    bodyStyle: `
      display:flex;
      align-items:stretch;
      `,
    width: useModelValue(800),
    left: useModelValue(left),
    top: useModelValue(top),
    children(size, div) {
      const model = useStoreValue(modelListStore, v => v.find(x => x.name == name)!, function (v, olds) {
        return olds.map(old => {
          if (old.name == v.name) {
            return v
          }
          return old
        })
      })
      const methods = useBuildSubSetObject(model, model.value.methods || emptyArray as any, 'methods') as RWValue<string[]>
      const selected = useModelValue<string>("@")
      const methodsModel = useMemo(() => {
        return modelStore.get().find(v => v.name == model.value.name)!.methods
      }, [model.value])
      dom.div({
        style: `
      padding-inline:1rem;
      width:300px;
      `
      }).render(function () {
        dom.div({
          className: cns(cls.row, "@" == selected.value && 'selected'),
          onClick() {
            selected.value = "@"
          }
        }).text`构造函数`
        const inputValue = useModelValue('')
        dom.div({
          style: `
        display:flex;
        height:30px;
        `
        }).render(function () {
          renderInput("input", {
            style: `
          flex:1;
          `,
            value: inputValue.value,
            onValueChange(v) {
              inputValue.value = v
            },
          })
          dom.button({
            onClick() {
              methods.value = [
                ...methods.value.filter(v => v != ''),
                ''
              ]
              selected.value = ''
            },
          }).text`+`
        })
        renderArray(useMemo(() => {
          const iv = inputValue.value.toLowerCase()
          return methodsModel.filter(x => {
            return (x.exp?.sign || '').toLowerCase().includes(iv)
          })
        }, [inputValue.value, methodsModel]), v => v.exp?.sign, (method, idx) => {
          dom.div({
            className: cls.rowContainer,
            style: `
            position:relative;
            `
          }).render(function () {
            dom.div({
              className: cns(cls.row, (method.exp?.sign || '') == selected.value && 'selected'),
              onClick() {
                selected.value = method.exp?.sign || ''
              }
            }).text`${method.exp?.sign || ''}`

            dom.button({
              className: 'remove',
              style: `
              position:absolute;
              right:0;
              top:0;
              `,
              onClick() {
                const vs = methods.value.slice()
                vs.splice(idx, 1)
                methods.value = vs
              }
            }).text`-`
          })
        })
      })



      renderIf(selected.value == "@", function () {
        function save() {
          if (selected.value == "@") {
            model.value = {
              ...model.value,
              init: current.value
            }
          }
        }

        const {
          current,
          renderContent
        } = useRenderCode(model.value.init || '', initContentEditableModel)
        const {
          tokens,
          tree
        } = useMemo(() => {
          const tokens = tokenize(current.value)
          const tree = parseInit(tokens.filter(filterInUserToken))
          return {
            tokens,
            tree
          }
        }, [current])
        renderContent({
          className: codeCls.code,
          style: `
      flex:1;
      white-space:pre-wrap;
      margin-bottom:1rem;
      `,
          onKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key == 's') {
              e.stopPropagation()
              e.preventDefault()
              save()
            }
          },
        }, function (div) {
          renderTree(tokens, [])
        })
      }, function () {
        renderOne(selected.value, function () {
          const idx = methodsModel.findIndex(v => (v.exp?.sign || '') == selected.value)
          const {
            current,
            renderContent
          } = useRenderCode(methods.value[idx], initContentEditableModel)
          const {
            tokens,
            tree
          } = useMemo(() => {
            const tokens = tokenize(current.value)
            const tree = parseMethod(tokens.filter(filterInUserToken))
            return {
              tokens,
              tree
            }
          }, [current])

          function save() {
            const sign = tree?.sign
            if (!sign) {
              alert('不是正确的算术')
            } else {
              selected.value = sign
              if (idx < 0) {
                methods.value = [
                  ...methods.value,
                  current.value
                ]
              } else {
                methods.value = methods.value.map(function (v, i) {
                  if (i == idx) {
                    return current.value
                  }
                  return v
                })
              }
            }
          }


          renderContent({
            className: codeCls.code,
            style: `
      flex:1;
      white-space:pre-wrap;
      margin-bottom:1rem;
      `,
            onKeyDown(e) {
              if ((e.ctrlKey || e.metaKey) && e.key == 's') {
                e.stopPropagation()
                e.preventDefault()
                save()
              }
            },
          }, function (div) {
            renderTree(tokens, [])
          })
        })
      })
    },
  }
})

const cls = cssMap({
  rowContainer: `
    >.remove{
      opacity:0;
    }
  &:hover{
    >.remove{
      opacity:1;
    }
  }
  `,
  row: `
  height:30px;
  display:flex;
  align-items:center;
  &:hover{
    background:aliceblue;
  }
  &.selected{
    background:aquamarine;
  }
  `
})

