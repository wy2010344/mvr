import { dom } from "mvr-dom";
import { Attribute, Init, Method, Model } from "../model";
import { useBuildSubSetObject } from "mvr-helper";
import { RWValue, emptyArray, emptyObject } from "wy-helper";
import { render参数面板 } from "./参数面板";
import { render方法面板 } from "./方法面板";
import { render构造方法 } from "./构造方法面板";
export function render类面板({
  model
}: {
  model: RWValue<Model>
}) {
  dom.div({
    style: `
    flex:1;
    display:flex;
    flex-direction:column;
    `
  }).render(function () {
    const attributes = useBuildSubSetObject(model, model.value.attributes || emptyArray as any, 'attributes') as RWValue<Attribute[]>
    const methods = useBuildSubSetObject(model, model.value.methods || emptyArray as any, 'methods') as RWValue<Method[]>
    const init = useBuildSubSetObject(model, model.value.init || emptyObject, 'init') as RWValue<Init>
    render参数面板({ attributes })
    render构造方法({
      init
    })
    render方法面板({
      methods
    })
  })
}