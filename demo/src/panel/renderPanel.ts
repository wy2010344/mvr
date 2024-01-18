import { dom, svg } from 'mvr-dom'
import { useEffect, useModelState, useModelValue, useRefConst } from 'mvr-helper'
import { initDrag, resizeHelper } from 'wy-dom-helper'
import { RWValue, getTheEmptyArray } from 'wy-helper'
import useResize from './useResize'
export type Size = {
  width: RWValue<number>
  height: RWValue<number>
  top: RWValue<number>
  left: RWValue<number>
}

export type PanelParams = {
  // portalTarget?(): Node
  title?(): void
  bodyStyle?: string
  children(p: Size, body: HTMLElement): void
  close(): void
  moveFirst(): void
  asPortal?: boolean
}

export default function renderPanel({
  width = useModelValue(400),
  height = useModelValue(600),
  top = useModelValue(100),
  left = useModelValue(100),
  title,
  bodyStyle,
  children,
  close,
  moveFirst,
  asPortal
  // portalTarget
}: PanelParams & Partial<Size>) {
  const dragResize = useRefConst(() => resizeHelper({
    addWidth(w) {
      width.value += w
    },
    addHeight(h) {
      height.value += h
    },
    addLeft(x) {
      left.value += x
    },
    addTop(y) {
      top.value += y
    }
  }))

  const titleHeight = 32
  return dom.div({
    // portalTarget,
    style: `
      left: ${left.value}px;
      top: ${top.value}px;
      position:absolute;
      background:white;
      border:1px solid gray;
      width:${width.value}px;
      height:${height.value}px;
      box-shadow:0px 0px 20px 10px;
      border-radius:5px;
    `,
    onClick: moveFirst,
  }).setPortal(asPortal).render(function () {

    useResize(dragResize)

    useEffect(() => {
      return initDrag(container, {
        move(e) {
          e.preventDefault()
          e.stopPropagation()
        },
        diffX(x) {
          left.value += x
        },
        diffY(y) {
          top.value += y
        }
      })
    }, [])

    const container = dom.div({
      style: `
          height:${titleHeight}px;
          cursor:move;
          display:flex;align-items:center;
          background:linear-gradient(180deg,transparent, #9e9595, transparent);
        `,
    }).render(function () {

      dom.div({
        style: ` 
            flex:1;color:#1f0abc;
            `,
      }).render(title as any)
      dom.button({
        style: `
            width:${titleHeight}px;
            height:${titleHeight}px;
            padding:0;margin:0;border:none;
            display:flex;
            align-items:center;
            justify-content:center;
            background:none;
            `,
        onClick(e) {
          e.stopPropagation()
          close()
        }
      }).render(function () {

        svg.svg({
          fill: "currentColor",
          strokeWidth: '0',
          viewBox: "0 0 1024 1024",
          style: `
                width:20px;
                height:20px;
                color:yellow;
              `,
        }).render(function () {
          svg.path({
            d: `M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 0 1-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z`
          }).render()
        })
      })
    })

    const div = dom.div({
      style: `
        position:relative;
        ${bodyStyle || ''}
        width:${width.value}px;
        height:${height.value - titleHeight}px;
        `,
    }).render(function () {
      children({ width, height, top, left }, div)
    })
  })
}