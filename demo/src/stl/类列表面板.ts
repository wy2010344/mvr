import { renderArray, renderIf, useMemo, useModelValue } from "mvr-helper"
import { Model, getModelKey } from "./model"
import { dom } from "mvr-dom"
import { renderInput } from "mvr-dom-helper"
import { cns, cssMap } from "wy-dom-helper"
import { RWValue } from "wy-helper"
import { useStrFilter } from "../util"


export function render类列表面板({
  modelListValue,
  addModel,
  selectedModelName
}: {
  modelListValue: Model[]
  addModel(name: string): void
  selectedModelName: RWValue<string>
}) {
  const inputValue = useModelValue('')
  const { matchItem, showModelList } = useStrFilter(inputValue.value, modelListValue, getModelKey)
  dom.div({
    style: `
      width:300px;
      `
  }).render(function () {
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
          className: cns(cls.clsRow, model.name == selectedModelName.value && 'selected'),
          onClick() {
            selectedModelName.value = model.name
          }
        }).render(function () {
          dom.div().text`${model.name}`
        })
      })
    })
  })
}

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