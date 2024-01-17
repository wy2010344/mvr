
import { renderOne, useEffect, useMemo, useModelValue } from "mvr-helper"
import { ContentEditableModel, EditRecord, MbRange, appendRecord, contentEditableText, fixScroll, mb } from "wy-dom-helper/contentEditable"
import { emptyArray } from "wy-helper"



export type EditAction = {
  type: "input"
  record: EditRecord
} | {
  type: "undo"
} | {
  type: "redo"
} | {
  type: "reset"
  record: EditRecord
}

function reducer(model: ContentEditableModel, action: EditAction): ContentEditableModel {
  if (action.type == "input") {
    return appendRecord(model, action.record)
  } else if (action.type == "undo") {
    const cdx = model.currentIndex
    if (cdx) {
      return {
        currentIndex: cdx - 1,
        history: model.history
      }
    }
  } else if (action.type == "redo") {
    const ndx = model.currentIndex + 1
    if (ndx < model.history.length) {
      return {
        currentIndex: ndx,
        history: model.history
      }
    }
  } else if (action.type == "reset") {
    return {
      currentIndex: 0,
      history: [action.record],
    };
  }
  return model
}

export function useContentEditable<T>(t: T, initFun: (t: T) => ContentEditableModel) {
  const valueModel = useModelValue(t, initFun)
  const value = valueModel.value
  function dispatch(action: EditAction) {
    const newModel = reducer(valueModel.value, action)
    valueModel.value = newModel
  }
  const current = useMemo(() => {
    return value.history[value.currentIndex]
  }, [value.history, value.currentIndex])
  return {
    current,
    value,
    dispatch,
    renderContentEditable(args: {
      readonly?: boolean
      noFocus?: boolean
    }, renderContent: () => HTMLElement) {
      renderOne(current.value, function () {
        const div = renderContent()
        useEffect(() => {
          if (args.readonly) {
            div.contentEditable = 'false'
          } else {
            div.contentEditable = contentEditableText + ''
          }
        }, [args.readonly])
        useEffect(() => {
          if (args.noFocus) {
            return
          }
          fixScroll(div, current)
        }, emptyArray)
      })
    }
  }
}