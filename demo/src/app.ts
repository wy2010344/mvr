import { emptyArray, quote } from "wy-helper";
import { useModel, createContext, useComputed } from "mvr-core";
import { createRoot, dom, getScheduleAskTime } from "mvr-dom";
import { useModelState, renderArray } from "mvr-helper";
import { useOnLine } from "mvr-dom-helper";

export function createmvr(app: HTMLElement) {
  const destroy = createRoot(app, function () {
    dom.div().render(function () {
      const [getValue, setValue] = useModel(0)
      const value = getValue()
      console.log("render", performance.now())
      context.useProvider({
        value,
        getValue,
        addValue() {
          setValue(getValue() + 1)
        },
      })

      const online = useOnLine()

      dom.button({
        onClick() {
          setValue(getValue() + 1)
        }
      }).text`点击${value} ${online + ''}`

      renderSub()
      renderToDoList()
    }, emptyArray)

  }, getScheduleAskTime({}))
}


function renderToDoList() {
  const [lists, setList, getList] = useModelState<number[]>(emptyArray as any)

  console.log("ddd", lists)
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

const context = createContext({
  value: 0,
  addValue() {

  },
  getValue() {
    return 9 as number
  }
})


function renderSub() {
  dom.div().render(function () {

    const [getValue, setValue] = useModel(0)
    const value = getValue()

    const abcValue = useComputed(() => getValue() + 9, () => [getValue()])
    dom.button({
      onClick() {
        setValue(getValue() + 1)
        const abc = abcValue()
        console.log("ddd", abc)
      }
    }).text`点击${value}`
    console.log("sub-render", abcValue(), performance.now())

    ThirdRender()
  }, emptyArray)
}


function ThirdRender() {
  dom.div().render(function () {
    const { getValue, addValue } = context.useConsumer()
    console.log("third---render", getValue())

    dom.button({
      onClick() {
        addValue()
        console.log("新的value是", getValue())
      }
    }).text`从context点击`
  }, emptyArray)
}
