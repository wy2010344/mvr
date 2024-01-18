import { renderIf, useBuildSubSetArray, useEffect, useMemo, useModelValue } from "mvr-helper";
import { panelWith } from "../panel/PanelContext";
import { dom } from "mvr-dom";
import { emptyArray } from "wy-helper";
import { render类列表面板 } from "./类列表面板";
import { Model, getModelKey } from "./model";
import { render类面板 } from "./类面板";


const saveModelKey = 'save-model-key'
function initModelKey() {
  const vs = JSON.parse(localStorage.getItem(saveModelKey) || '[]')
  console.log("ddd", vs)
  return vs
}

/**
 * 主要目的是翻译成别的语言,比如kotlin,ts,而不是自建解释器,不自建运行时.
 * 做成ts的子集,lambda是一个单独的类.
 */
export default panelWith(function (operate) {
  return {
    width: useModelValue(800),
    bodyStyle: `
      display:flex;
      align-items:stretch;
      padding-inline:1rem;
      box-sizing: border-box;
      gap:1rem;
      `,
    children(size, div) {
      const modelList = useModelValue<Model[]>(emptyArray as any[], initModelKey)
      useEffect(() => {
        localStorage.setItem(saveModelKey, JSON.stringify(modelList.value))
      }, [modelList.value])
      const selectedModelName = useModelValue('')
      const selectedModel = useMemo(() => {
        return modelList.value.find(v => v.name == selectedModelName.value)
      }, [selectedModelName.value, modelList.value])

      render类列表面板({
        selectedModelName,
        modelListValue: modelList.value,
        addModel(name) {
          modelList.value = [
            {
              name
            },
            ...modelList.value
          ]
          selectedModelName.value = name
        },
      })





      renderIf(selectedModel, function () {
        const [model, deleteModel] = useBuildSubSetArray(modelList, selectedModel!, getModelKey)
        render类面板({
          model,
        })
      }, function () {
        dom.div({
          style: `
      flex:1;
      display:flex;
      align-items:center;
      justify-content:center;
      `
        }).text`未选中`
      })
    },
  }
})
