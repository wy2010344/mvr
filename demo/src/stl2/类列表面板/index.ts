import { RWValue } from "wy-helper"
import { Model, getModelKey, modelListStore } from "../model"
import { renderArray, renderIf, useModelValue, useStoreValue } from "mvr-helper"
import { useStrFilter } from "../../util"
import { dom } from "mvr-dom"
import { renderInput } from "mvr-dom-helper"
import { cns, cssMap } from "wy-dom-helper"
import { panelWith } from "../../panel/PanelContext"
import 类面板 from "../类面板"


export default panelWith(function (operate, id) {

  return {
    width: useModelValue(300),
    bodyStyle: `
      padding-inline:1rem;
      box-sizing: border-box;
      gap:1rem;
      `,
    children(size, div) {
      const modelList = useStoreValue(modelListStore)
      function addModel(name: string) {
        modelListStore.set([
          {
            name
          },
          ...modelList.value
        ])
      }
      const inputValue = useModelValue('')
      const { matchItem, showModelList } = useStrFilter(inputValue.value, modelList.value, getModelKey)
      dom.div().render(function () {

        //右边
        dom.div({
          style: `
        display:flex;
        align-items:center;
        height:30px;
        `
        }).render(function () {
          //头部
          renderInput("input", {
            style: `
          flex:1;
          `,
            placeholder: '请输入名字',
            value: inputValue.value,
            onValueChange(v) {
              inputValue.value = v
            },
          })
          renderIf(inputValue.value, function () {
            dom.button({
              onClick() {
                inputValue.value = ''
              }
            }).text`删除`
          })
          renderIf(!matchItem && inputValue.value, function () {
            dom.button({
              onClick() {
                addModel(inputValue.value)
                inputValue.value = ''
              }
            }).text`增加`
          })
        })
        dom.div({}).render(function () {
          renderArray(showModelList, getModelKey, function (model) {
            dom.div({
              className: cls.clsRow,
              onClick(e) {
                e.stopPropagation()
                类面板(operate, {
                  name: model.name,
                  left: size.left.value + size.width.value,
                  top: size.top.value
                })
              }
            }).render(function () {
              dom.div().text`${model.name}`
            })
          })
        })
      })
    }
  }
})
const cls = cssMap({
  clsRow: `
  width:100%;
  &:hover{
    background:aliceblue;
  }
  &.selected{
    background:aquamarine;
  }
  `
})