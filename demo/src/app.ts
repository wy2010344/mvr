import { RWValue, emptyArray, quote } from "wy-helper";
import { createContext } from "mvr-core";
import { createRoot, dom, getScheduleAskTime } from "mvr-dom";
import { useModelState, renderArray, useEffect, useModel, useComputed, useComputedValue, useModelValue } from "mvr-helper";
import { useOnLine } from "mvr-dom-helper";
import { page1 } from "./page1";
import { normalPanel, renderPanelProvider } from "./panel/PanelContext";
import stl from "./stl";
import { 类列表面板 } from "./stl2";

export function createmvr(app: HTMLElement) {
  const destroy = createRoot(app, function () {
    const operator = renderPanelProvider()
    useEffect(() => {
      // demoPanel(operator)
      // stl(operator, null)
      类列表面板(operator, null)
    }, emptyArray)
  }, getScheduleAskTime({}))
}


const demoPanel = normalPanel(function (operator) {
  console.log("render")
  dom.div().render(function () {
    const value = useModelValue(0)
    console.log("render", performance.now())
    context.useProvider({
      value,
      addValue() {
        value.value++
      },
    })

    const online = useOnLine()

    dom.button({
      onClick() {
        value.value++
      }
    }).text`点击${value.value} ${online + ''}`

    renderSub()
    renderToDoList()
  }, emptyArray)
  // page1()
})
function renderToDoList() {
  const [lists, setList, getList] = useModelState<number[]>(emptyArray as any)
  renderArray(lists, quote, function (row, i) {

    dom.div().render(function () {
      dom.span().text`----${i}---${row}---`
      dom.button({
        onClick() {
          setList(getList().filter(v => v != row))
        }
      }).text`删除`
    })
  })

  dom.button({
    onClick() {
      setList(getList().concat(Date.now() + Math.random()))
    }
  }).text`增加`
}

const context = createContext<{
  value: RWValue<number>
  addValue(): void
}>(null as any)


function renderSub() {
  dom.div().render(function () {

    const value = useModelValue(0)

    const abcValue = useComputedValue(value.value + 9)
    dom.button({
      onClick() {
        value.value++
        const abc = abcValue.value;
        console.log("ddd", abc)
      }
    }).text`点击${value.value}`
    console.log("sub-render", abcValue.value, performance.now())

    ThirdRender()
  }, emptyArray)
}


function ThirdRender() {
  dom.div().render(function () {
    const { value, addValue } = context.useConsumer()
    console.log("third---render", value)

    const agc = useComputedValue(value.value + 1)
    dom.button({
      onClick() {
        addValue()
        console.log("新的value是", value.value, agc.value)
      }
    }).text`从context点击`
  }, emptyArray)
}
