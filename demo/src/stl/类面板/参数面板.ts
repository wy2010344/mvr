import { dom } from "mvr-dom";
import { Attribute, Model, getAttributeKey } from "../model";
import { renderArray, renderIf, useBuildSubSetArray, useBuildSubSetObject, useModelValue } from "mvr-helper";
import { renderInput, renderInputCheckbox } from "mvr-dom-helper";
import { RValue, RWValue, emptyArray } from "wy-helper";
import { cns, cssMap } from "wy-dom-helper";
import { useStrFilter } from "../../util";

export function render参数面板({
  attributes
}: {
  attributes: RWValue<Attribute[]>
}) {

  const inputValue = useModelValue('')
  const { matchItem, showModelList } = useStrFilter(inputValue.value, attributes.value, getAttributeKey)
  dom.div({
    style: `
    height:200px;
    `
  }).render(function () {
    dom.div({
      style: `
      display:flex;
      align-items:center;
      height:30px;
      `
    }).render(function () {
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
            attributes.value = [
              {
                name: inputValue.value
              },
              ...attributes.value || emptyArray
            ]
            inputValue.value = ''
          }
        }).text`增加`
      })
    })
    dom.div({

    }).render(function () {
      dom.table({
        style: `
        width:100%;
        `
      }).render(function () {
        renderArray(showModelList, getAttributeKey, function (attr) {
          const [attrValue] = useBuildSubSetArray(attributes as RWValue<Attribute[]>, attr, getAttributeKey)
          dom.tr({
            className: cls.clsRow,
          }).render(function () {
            dom.td({
              style: `
              width:30px;
              `
            }).render(function () {
              renderInputCheckbox({
                checked: attr.readonly,
                onCheckedChange(v) {
                  attrValue.value = {
                    ...attrValue.value,
                    readonly: v
                  }
                },
              })
            })
            dom.td().text`${attr.name}`
          })
        })
      })
    })
  })
}

const cls = cssMap({
  clsRow: `
  &:hover{
    background:aliceblue;
  }
  &.selected{
    background:aquamarine;
  }
  `
})