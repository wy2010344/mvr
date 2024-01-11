
import { Direction, ResizeHelper, initDrag, stringifyStyle } from "wy-dom-helper";
import { useEffect } from 'mvr-helper'
import { dom } from 'mvr-dom'
export default function useResize(resize: ResizeHelper) {
  function makeDrag(dom: HTMLElement, dir: Direction) {
    useEffect(() => {
      return initDrag(dom, {
        // start(e) {
        //   e.preventDefault()
        //   e.stopPropagation()
        // },
        move(e) {
          e.preventDefault()
          e.stopPropagation()
        },
        // end(e) {
        //   e.preventDefault()
        //   e.stopPropagation()
        // },
        diff: resize(dir),
      })
    }, [])
  }
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "100%",
      height: "7px",
      position: "absolute",
      top: "-3px",
      left: "0",
      cursor: "n-resize"
    })
  }).render(), { t: true })
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "7px",
      height: "100%",
      position: "absolute",
      right: "-3px",
      top: "0",
      cursor: "e-resize"
    }),
  }).render(), { r: true })
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "7px",
      height: "100%",
      position: "absolute",
      left: "-3px",
      top: "0",
      cursor: "w-resize"
    })
  }).render(), { l: true })
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "100%",
      height: "7px",
      position: "absolute",
      bottom: "-3px",
      left: "0",
      cursor: "s-resize"
    }),
  }).render(), { b: true })
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      top: "-7px",
      left: "-7px",
      cursor: "nw-resize"
    }),
  }).render(), { t: true, l: true })
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      top: "-7px",
      right: "-7px",
      cursor: "ne-resize"
    }),
  }).render(), { t: true, r: true })
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      bottom: "-7px",
      left: "-7px",
      cursor: "sw-resize"
    }),
  }).render(), { b: true, l: true })
  makeDrag(dom.div({
    style: stringifyStyle({
      width: "15px",
      height: "15px",
      position: "absolute",
      bottom: "-7px",
      right: "-7px",
      cursor: "se-resize"
    })
  }).render(), { b: true, r: true })
}
