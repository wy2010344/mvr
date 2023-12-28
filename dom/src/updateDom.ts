import { getAttributeAlias } from "./getAttributeAlias"
import { DomElementType, SvgElementType } from "./html"
import {
  FindParentAndBefore, useLevelEffect,
  VirtaulDomNode
} from "mvr-core"

export type Props = { [key: string]: any }
interface FiberAbsNode extends VirtaulDomNode {
  node: Node
}
export const EMPTYPROPS = {}
// const INPUTS = ["input", "textarea", "select"]

export class FiberNode implements FiberAbsNode {
  private constructor(
    public node: Node,
    private _updateProp: (node: Node, key: string, value: any) => void,
    public readonly isPortal?: boolean,
  ) { }
  private updateDomEffect() {
    updateDom(this, this.props, this.oldProps)
    this.oldProps = this.props
  }
  //这个props不需要AtomValue,因为在运行时不访问
  private props: Props = EMPTYPROPS
  private oldProps: Props = EMPTYPROPS
  useUpdate(props: Props): void {
    this.props = props
    const that = this
    useLevelEffect(0, function () {
      that.updateDomEffect()
    })
  }
  static create(
    node: Node,
    updateProps: (node: Node, key: string, value: any) => void,
    isPortal?: boolean,
  ) {
    return new FiberNode(
      node,
      updateProps,
      isPortal
    )
  }
  static createDomWith(node: Node, isPortal?: boolean) {
    return new FiberNode(node, updateProps, isPortal)
  }
  static createDom<T extends DomElementType>(type: T, isPortal?: boolean) {
    return FiberNode.createDomWith(
      document.createElement(type),
      isPortal
    )
  }
  static portalCreateDom<T extends DomElementType>(type: T) {
    return FiberNode.createDom(type, true)
  }
  static createSvgWith(node: Node, isPortal?: boolean) {
    return new FiberNode(
      node,
      updateSVGProps,
      isPortal
    )
  }
  static createSvg<T extends SvgElementType>(type: T, isPortal?: boolean) {
    return FiberNode.createSvgWith(
      document.createElementNS("http://www.w3.org/2000/svg", type),
      isPortal
    )
  }
  static portalCreateSvg<T extends SvgElementType>(type: T) {
    return FiberNode.createSvg(type, true)
  }
  appendAfter(value?: FindParentAndBefore): void {
    appendAfter(this, value as any)
  }
  destroy(): void {
    if (this.isPortal) {
      this.removeFromParent()
    }
  }

  removeFromParent() {
    const props = this.props
    if (props.exit) {
      props.exit(this.node, props).then(() => {
        realRemove(this.node)
      })
    } else {
      realRemove(this.node)
    }
  }

  updateProp(key: string, value: any) {
    this._updateProp(this.node, key, value)
  }
}

function realRemove(node: Node) {
  node.parentElement?.removeChild(node)
}

export class FiberText implements FiberAbsNode {
  public node: Node = document.createTextNode("")
  static create() {
    return new FiberText()
  }
  appendAsPortal(): void {

  }
  useUpdate(content: string) {
    if (this.oldContent != content) {
      this.node.textContent = content
      this.oldContent = content
    }
  }
  private oldContent: string = ""
  appendAfter(value: FindParentAndBefore): void {
    appendAfter(this, value as any)
  }
  removeFromParent(): void {
    this.node.parentElement?.removeChild(this.node)
  }
  destroy(): void {
  }
}
export const emptyFun = () => { }

/**
 * 更新节点
 * @param dom 
 * @param oldProps 
 * @param props 
 */
function updateDom(
  dom: FiberNode,
  props: Props,
  oldProps: Props
) {
  const node = dom.node
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  const prevKeys = Object.keys(oldProps)
  const nextKeys = Object.keys(props)
  prevKeys
    .filter(isEvent)
    .filter(key => !(key in props) || isNew(oldProps, props)(key))
    .forEach(name => {
      let eventType = name.toLowerCase().substring(2)
      if (eventType.endsWith(Capture)) {
        eventType = eventType.slice(0, eventType.length - Capture.length)
        node.removeEventListener(eventType, oldProps[name], true)
      } else {
        node.removeEventListener(eventType, oldProps[name])
      }
    })
  //移除旧的不存在属性
  prevKeys
    .filter(isProperty)
    .filter(isGone(oldProps, props))
    .forEach(name => dom.updateProp(name, undefined))
  //修改变更属性
  nextKeys
    .filter(isProperty)
    .filter(isNew(oldProps, props))
    .forEach(name => dom.updateProp(name, props[name]))

  //添加变更事件
  nextKeys
    .filter(isEvent)
    .filter(isNew(oldProps, props))
    .forEach(name => {
      let eventType = name.toLowerCase().substring(2)
      if (eventType.endsWith(Capture)) {
        eventType = eventType.slice(0, eventType.length - Capture.length)
        node.addEventListener(eventType, props[name], true)
      } else {
        node.addEventListener(eventType, props[name])
      }
    })
}

const Capture = "capture"

/**
 * 是否是事件
 * @param key 
 * @returns 
 */
function isEvent(key: string) {
  return key.startsWith("on")
}
/**
 * 是否是属性，非child且非事件
 * @param key 
 * @returns 
 */
function isProperty(key: string) {
  return key != 'children'
    && !isEvent(key)
    && key != 'exit'
}
/**
 * 属性发生变更
 * @param prev 
 * @param next 
 * @returns 
 */
function isNew(prev: Props, next: Props) {
  return function (key: string) {
    return prev[key] != next[key]
  }
}
/**
 * 新属性已经不存在
 * @param prev 
 * @param next 
 * @returns 
 */
function isGone(prev: Props, next: Props) {
  return function (key: string) {
    return !(key in next)
  }
}

const emptyKeys = ['href', 'className']
export function updateProps(node: any, key: string, value: any) {
  if (key.includes('-')) {
    node.setAttribute(key, value)
  } else {
    if (emptyKeys.includes(key) && !value) {
      node.removeAttribute(key)
    } else {
      node[key] = value
    }
  }
}
export function updateSVGProps(node: any, key: string, value: any) {
  if (key == 'innerHTML' || key == 'textContent') {
    updateProps(node, key, value)
  } else {
    if (value) {
      if (key == 'className') {
        key = 'class'
      }
      key = getAttributeAlias(key)
      node.setAttribute(key, value)
    } else {
      node.removeAttribute(key)
    }
  }
}
/**
 * 调整、追加节点
 * @param parent 
 * @param dom 
 * @param before 
 */
export function appendAfter(dom: FiberAbsNode, parentAndBefore: [FiberAbsNode, FiberAbsNode | null] | [FiberAbsNode | null, FiberAbsNode]) {
  const [parent, before] = parentAndBefore

  const parentDom = parent ? parent.node : before?.node.parentNode
  if (parentDom) {
    const beforeNode = before?.node
    if (beforeNode) {
      //如果有前节点
      const nextNode = beforeNode.nextSibling
      if (nextNode) {
        //如果有后继节点,且后继不为自身
        if (nextNode != dom.node) {
          //console.log("next-insert-before", dom.node, nextNode)
          parentDom.insertBefore(dom.node, nextNode)
        }
      } else {
        //如果没有后继节点,直接尾随
        //console.log("next-append", dom.node)
        parentDom.appendChild(dom.node)
      }
    } else {
      //如果没有前继节点
      const firstChild = parentDom.firstChild
      if (firstChild) {
        //父元素有子元素,
        if (firstChild != dom.node) {
          //console.log("first-insert-before", dom.node, firstChild)
          parentDom.insertBefore(dom.node, firstChild)
        }
      } else {
        //父元素无子元素,直接尾随
        //console.log("first-append", dom.node)
        parentDom.appendChild(dom.node)
      }
    }
  } else {
    console.error("未找到parent-dom????")
  }
}

export function isSVG(name: string) {
  return svgTagNames.includes(name as any)
}
export const svgTagNames: SvgElementType[] = [
  "svg",
  "animate",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tspan",
  "use",
  "view"
]

export const domTagNames: DomElementType[] = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noindex",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "slot",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "template",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "webview"
]