import { RWValue, emptyArray } from "wy-helper";
import { Model, modelListStore } from "../model";
import { dom } from "mvr-dom";
import { panelWith } from "../../panel/PanelContext";
import { renderArray, renderIf, renderOne, useBuildSubSetObject, useEffect, useMemo, useModelValue, useStoreTriggerRender } from "mvr-helper";
import { useValueCenterValue } from "../../util";
import { renderInput, useRenderCode } from "mvr-dom-helper";
import { cns, cssMap } from "wy-dom-helper";
import { filterInUserToken, tokenize } from "./tokenize";
import { parseMethod } from "./parseMethod";
import { initContentEditableModel, mb } from "wy-dom-helper/contentEditable";
import { renderTree } from "./renderTree";

export default panelWith<{
  name: string
  left: number
  top: number
}>({
  useArgs() {
    return {
      bodyStyle: `
      display:flex;
      align-items:stretch;
      `
    }
  },
  children(operate, id, {
    name, left, top
  }, size, div) {
    useEffect(() => {
      size.width.value = 800
      size.left.value = left
      size.top.value = top
    }, emptyArray)

    const model = useValueCenterValue(modelListStore, v => v.find(x => x.name == name)!, function (v, olds) {
      return olds.map(old => {
        if (old.name == v.name) {
          return v
        }
        return old
      })
    })
    const selected = useModelValue<string | Model>(model.value)
    const methods = useBuildSubSetObject(model, model.value?.methods || emptyArray as string[], 'methods') as RWValue<string[]>
    const methodsModel = useMemo(() => {
      return methods.value.map(method => {
        const tokens = tokenize(method)
        const tree = parseMethod(tokens.filter(filterInUserToken))
        return {
          sign: tree?.getSign() || '',
          tokens,
          tree
        }
      })
    }, [methods.value])
    dom.div({
      style: `
      padding-inline:1rem;
      width:300px;
      `
    }).render(function () {
      dom.div({
        className: cns(cls.row, model.value == selected.value && 'selected'),
        onClick() {
          selected.value = model.value
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
            const idx = methods.value.findIndex(v => v == '')
            if (idx < 0) {
              methods.value = [
                ...methods.value,
                ''
              ]
            } else {
              selected.value = ''
            }
          },
        }).text`+`
      })
      renderArray(methodsModel, v => v.sign, (method) => {
        dom.div({
          className: cns(cls.row, method.sign == selected.value && 'selected'),
          onClick() {
            selected.value = method.sign
          }
        }).text`${method.sign}`
      })
    })



    renderIf(selected.value == model.value, function () {
      function save(value: string) {
        if (selected.value == model.value) {
          model.value = {
            ...model.value,
            init: value
          }
        }
      }
    }, function () {
      renderOne(selected.value, function () {
        const idx = methodsModel.findIndex(v => v.sign == selected.value)

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
          const sign = tree?.getSign()
          if (!sign) {
            alert('不是正确的算术')
          } else {
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
})


const cls = cssMap({
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


export const codeCls = cssMap({
  code: `
	padding: .15em .2em .05em;
	border-radius: .3em;
	border: .13em solid hsl(30, 20%, 40%);
	box-shadow: 1px 1px .3em -.1em black inset;
	white-space: normal;
	background: hsl(30, 20%, 25%);
  color:white;
  .token{
    &.comment{
	    color: hsl(30, 20%, 50%);
    }
    &.string{
      color:hsl(75, 70%, 60%);
    }
    &.variable{
    	color: hsl(40, 90%, 60%);
    }
    &.keyword{
      color:hsl(40, 90%, 60%);
    }
    &.number{
      color: hsl(350, 40%, 70%)
    }
    &.error{
      text-decoration-color: red;
      text-decoration-line: underline;
      text-decoration-style: wavy;
    }
  }
  `
})
