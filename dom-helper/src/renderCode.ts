import { EmptyFun, emptyArray } from "wy-helper"
import { ContentEditableModel, contentDelete, contentEnter, contentTab, getCurrentRecord, mb } from "wy-dom-helper/contentEditable"
import { React, dom } from "mvr-dom"
import { useAtom, useAttrEffect } from "mvr-helper"
import { useContentEditable } from "./useContentEditable"

export function useRenderCode<T>(
  init: T,
  initFun: (v: T) => ContentEditableModel,
) {
  const { value, dispatch, current, renderContentEditable } = useContentEditable(init, initFun)
  const editorRef = useAtom<HTMLDivElement | undefined>(undefined)
  return {
    value,
    current,
    dispatch,
    getEditor() {
      return editorRef.get()
    },
    renderContent(
      props: React.HTMLAttributes<HTMLDivElement> & {
        readonly?: boolean
      },
      render: (div: HTMLDivElement) => void
    ) {
      renderContentEditable({
        readonly: props?.readonly
      }, function () {
        const div = dom.div({
          ...props,
          spellcheck: false,
          className: `${props?.className || ''}`,
          onInput(event: any) {
            if (event.isComposing) {
              return
            }
            dispatch({
              type: "input",
              record: getCurrentRecord(div)
            })
          },
          onCompositionEnd(event) {
            dispatch({
              type: "input",
              record: getCurrentRecord(div)
            })
          },
          onKeyDown(e) {
            if (mb.DOM.keyCode.TAB(e)) {
              e.preventDefault()
              const record = contentTab(div, e.shiftKey)
              if (record) {
                dispatch({
                  type: "input",
                  record
                })
              }
            } else if (mb.DOM.keyCode.ENTER(e)) {
              e.preventDefault()
              const record = contentEnter(div)
              dispatch({
                type: "input",
                record
              })
            } else if (mb.DOM.keyCode.Z(e)) {
              if (isCtrl(e)) {
                if (e.shiftKey) {
                  //redo
                  e.preventDefault()
                  dispatch({
                    type: "redo"
                  })
                } else {
                  //undo
                  e.preventDefault()
                  dispatch({
                    type: "undo"
                  })
                }
              }
            } else if (mb.DOM.keyCode.BACKSPACE(e)) {
              e.preventDefault()
              const record = contentDelete(div)
              if (record) {
                dispatch({
                  type: "input",
                  record
                })
              }
            }
            props.onKeyDown?.(e)
          },
        }).render(function () {
          render(div)
        })
        useAttrEffect(() => {
          editorRef.set(div)
        }, emptyArray)
        return div
      })
    }
  }
}
function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}
