import { dom } from "mvr-dom";
import { renderInput } from "mvr-dom-helper";
import { RWValue } from "wy-helper";
import { Init } from "../model";

/**
 * 构造方法,没有方法名,只供类初始化
 * @map
 * @list
 * #turple :99 :bb
 * #record a :98 b :89
 * 4种类型
 * 这些类型也可以全局类的方法,即通过反射,依赖某种类型.?也许只有@map 与 @list 可以指定具体使用什么类型
 * 
 * 在类初始化的时候,(Abc #init a :98 b :88)
 * 
 * 可以省略书写构造,即根据属性自动生成
 * 某些属性是可选的,某些是必填的.
 */
export function render构造方法({
  init
}: {
  init: RWValue<Init>
}) {
  dom.div().render(function () {
    renderInput("input", {
      placeholder: '请输入参数列表',
      style: `
      width:100%
      `,
      value: init.value.args || '',
      onValueChange(v) {
        init.value = {
          ...init.value,
          args: v
        }
      },
    })
    renderInput("textarea", {
      placeholder: '请输入构造函数',
      style: `
      width:100%
      `,
      value: init.value.body || '',
      onValueChange(v) {
        init.value = {
          ...init.value,
          body: v
        }
      },
    })
  })
}