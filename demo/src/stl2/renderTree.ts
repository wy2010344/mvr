import { ErrorArea, MToken, } from "./parse/tokenize"
import { emptyArray, removeWhere } from "wy-helper"
import { cns } from "wy-dom-helper"
import { useErrorContextProvide } from "./model"
import { renderFragment, renderIf, useEffect, useModelValue } from "mvr-helper"
import { dom, renderContent } from "mvr-dom"






function renderMaxNode(node: RangeNode, subList: RangeNode[]) {
  let theType = ''
  let thisErrors: string[] = []
  let theValue: string | undefined = undefined
  node.list.forEach(v => {
    if (v instanceof ErrorArea) {
      thisErrors.push(v.message)
    } else {
      theType = v.getClassName()
      theValue = v.value
    }
  })


  const derrors = useErrorContextProvide(thisErrors)
  const hover = useModelValue(false)
  renderIf(hover.value && derrors.length, function () {
    useEffect(() => {
      const box = tdiv.getBoundingClientRect()
      div.style.bottom = window.innerHeight - box.top + 'px'
      div.style.left = box.left + 'px'
      document.body.append(div)
    }, emptyArray)
    const div = dom.div({
      style: `
      position:fixed;
      background:white;
      `
    }).asPortal().render(function () {
      derrors.forEach(error => {
        dom.div().renderTextContent(error)
      })
    })
  })

  const tdiv = dom.span({
    className: cns(theType, 'token', thisErrors.length ? 'error' : ''),
    onMouseEnter(event) {
      hover.value = true
    },
    onMouseLeave() {
      hover.value = false
    }
  }).render(function () {
    if (subList.length) {
      renderTreeItem(subList)
    } else {
      if (theValue) {
        renderContent(theValue)
      }
    }
  })
}


export function renderTree(tokens: MToken[], errorAreas: ErrorArea[]) {
  const allArea = groupRange([...tokens, ...errorAreas])
  renderTreeItem(allArea)
}

function renderTreeItem(allArea: RangeNode[]) {
  let index = 0
  while (allArea.length) {
    const maxIdx = renderArea(index, allArea)
    if (!(maxIdx < 0)) {
      const [maxNode] = allArea.splice(maxIdx, 1)
      index = maxNode.end
      const thisList = split(allArea, x => {
        return maxNode!.begin <= x.begin && x.end <= maxNode!.end
      })
      renderFragment(() => {
        renderMaxNode(maxNode, thisList)
      })
    }
  }
}

function renderArea(begin: number, all: RangeNode[]) {
  let idx = -1
  for (let i = 0; i < all.length; i++) {
    const row = all[i]
    if (row.begin == begin) {
      if (idx < 0) {
        idx = i
      } else {
        if (row.end > all[idx].end) {
          idx = i
        }
      }
    }
  }
  return idx
}

type MergeType = MToken | ErrorArea

type RangeNode = {
  begin: number
  end: number
  list: MergeType[]
}
function groupRange(list: MergeType[]) {
  const allList: RangeNode[] = []
  for (const row of list) {
    const ext = allList.find(x => x.begin == row.begin && x.end == row.end)
    if (ext) {
      ext.list.push(row)
    } else {
      allList.push({
        begin: row.begin,
        end: row.end,
        list: [
          row
        ]
      })
    }
  }
  return allList
}


function split<T>(list: T[], filter: (v: T) => boolean) {
  const outList: T[] = []
  removeWhere(list, v => {
    if (filter(v)) {
      outList.push(v)
      return true
    }
    return false
  })
  return outList
}