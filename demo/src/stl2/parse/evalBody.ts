import { Que, andRuleGet, manyRuleGet, match, matchEnd, matchToEnd, notMathChar, orMatch, orRuleGet, ruleGet } from "wy-helper/tokenParser";
import { AssignExp, BlockExp, CallExp, Exp, ExpMsgNode, StringExp } from "./model";
import { NumberToken, PureToken } from "./tokenize";
import { quote } from "wy-helper";
import { Scope, globalScope } from "./ScopeLib";
import { TModel, modelStore } from "../model";




class RScope implements Scope {
  private map: {
    [key: string]: any
  } = {}
  constructor(
    private parent: Scope
  ) { }
  set(key: string, value: any) {
    if (key in this.map) {
      this.map[key] = value
    } else {
      this.parent.set(key, value)
    }
  }
  get(key: string) {
    if (key in this.map) {
      return this.map[key]
    }
    return this.parent.get(key)
  }
  add(key: string) {
    this.map[key] = null
  }
  addSet(key: string, value: any) {
    this.map[key] = value
  }
}

const pScope = new RScope(globalScope)
pScope.addSet("true", true)
pScope.addSet("false", false)
pScope.addSet("nil", null)

export function evalBody(list: (Exp | AssignExp)[], scope?: Scope) {
  let theScope = scope || new RScope(pScope)
  let out = null
  list.forEach(row => {
    if (row instanceof AssignExp) {
      const right = evalExp(row.exp, theScope)
      if (scope) {
        theScope.set(row.name.value, right)
      } else {
        theScope.add(row.name.value)
        theScope.set(row.name.value, right)
      }
      out = null
    } else {
      out = evalExp(row, theScope)
    }
  })
  return out
}


function evalBodyWithVars(
  vars: PureToken[] | undefined,
  list: (Exp | AssignExp)[],
  scope: Scope
) {
  if (vars) {
    for (const v of vars) {
      scope.add(v.value)
    }
  }
  return evalBody(list, scope)
}

function evalExp(exp: Exp, scope: Scope): any {
  if (exp instanceof CallExp) {
    const value = evalExp(exp.node, scope)
    var ret = null
    for (let line of exp.msg) {
      let lineRet = value;
      for (let msg of line) {
        lineRet = sendMessage(lineRet, evalMsg(msg, scope))
      }
      ret = lineRet
    }
    return ret
  } else if (exp instanceof PureToken) {
    return scope.get(exp.value)
  } else if (exp instanceof NumberToken) {
    return exp.number
  } else if (exp instanceof StringExp) {
    if (exp.rests) {
      const vs: string[] = [exp.first.string]
      for (const r of exp.rests) {
        const value = evalExp(r.exp, scope)
        vs.push(sendMessage(value, 'toString'))
        vs.push(r.string.string)
      }
      return vs.join('')
    } else {
      return exp.first.string
    }
  } else if (exp instanceof BlockExp) {
    return new BlockInp(exp, scope)
  } else {
    throw new Error('unknown exp' + exp)
  }
}


function evalMsg(msg: PureToken | ExpMsgNode[], scope: Scope) {
  if (msg instanceof PureToken) {
    return msg.value
  } else {
    const vs: MsgNode[] = []
    for (const n of msg) {
      vs.push(new MsgNode(n.key.value, evalExp(n.value, scope)))
    }
    return vs
  }
}




class MsgNode {
  constructor(
    public readonly key: string,
    public readonly value: any
  ) { }
}


class SelfClass {
  constructor(
    public readonly name: string
  ) { }
}


class BlockInp {
  constructor(
    public readonly exp: BlockExp,
    public readonly scope: Scope
  ) { }

  eval(args: any[]) {
    const params = this.exp.params
    const newScope = new RScope(this.scope)
    if (params) {
      for (let i = 0; i < params.length; i++) {
        const key = params[i].value.slice(1)
        newScope.addSet(key, args[i])
      }
    }
    // console.log(args, newScope)
    return evalBodyWithVars(this.exp.vars, this.exp.body, newScope)
  }
}

function sendMessage(value: any, msg: string | MsgNode[]): any {
  if (value instanceof SelfClass) {
    return didSendMessage(value.name, value, msg)
  } else if (Array.isArray(value)) {
    return didSendMessage('Array', value, msg)
  } else if (value instanceof TModel) {
    if (value.name == "Array" && msg == 'new') {
      return []
    }
    console.log("尚未处理", value)
  } else if (value instanceof BlockInp) {
    return didSendMessage("Block", value, msg)
  } else {
    const tp = typeof value
    if (tp == 'string') {
      return didSendMessage('String', value, msg)
    } else if (tp == 'number') {
      return didSendMessage('Number', value, msg)
    } else if (tp == 'boolean') {
      return didSendMessage("Boolean", value, msg)
    } else if (value == null) {
      return didSendMessage("Nil", value, msg)
    } else {
      console.log("未找到类型", tp, value)
    }
  }
}


function didSendMessage(clsName: string, obj: any, msg: string | MsgNode[]): any {
  const define = modelStore.get().find(v => v.name == clsName)
  if (define) {
    const sign = Array.isArray(msg) ? msg.map(v => v.key).join('') : msg
    return evalMethod(define, obj, sign, msg)
  }
  console.log("未找到类型定义", clsName)
}


function getMethod(define: TModel, sign: string) {
  const method = define.methods.find(v => v.exp?.sign == sign)
  if (!method) {
    const parentName = define.init?.exp?.extend.value
    if (parentName) {
      const parent = modelStore.get().find(v => v.name == parentName)
      if (parent) {
        return getMethod(parent, sign)
      }
    }
  }
  return {
    define,
    method
  }
}

/**
 * 是否有有一种原型函数的转发,像js的apply,指定不同的this.
 * 即每一个方法,如Array::add:xx,都增加一个Array.apply:obj.add:xx
 * @param define 
 * @param obj 
 * @param sign 
 * @param msg 
 * @returns 
 */
function evalMethod(define: TModel, obj: any, sign: string, msg: MsgNode[] | string) {
  const { define: originDefine, method } = getMethod(define, sign)
  // console.log("find", define, originDefine, obj, sign, msg)
  if (method) {
    if (originDefine.name == 'String' && method.exp?.sign == 'evalWith:') {
      try {
        const out = eval(obj)
        const vs = (msg as MsgNode[])[0].value
        return out.apply(null, vs)
      } catch (err) {
        console.log(err)
      }
    } else if (originDefine.name == 'Array' && sign == 'add:') {
      const v = (msg as MsgNode[])[0].value
      obj.push(v)
      return obj
    } else if (originDefine.name == 'Boolean' && sign == 'isTrue:else:') {
      return obj ? (msg as MsgNode[])[0].value : (msg as MsgNode[])[1].value
    } else if (originDefine.name == 'Block' && sign == 'execWith:') {
      const o = obj as BlockInp
      const args = (msg as MsgNode[])[0].value as any[]
      return o.eval(args)
    }
    const exp = method.exp!
    const scope = new RScope(pScope)
    scope.addSet("self", obj)
    if (Array.isArray(exp.head) && Array.isArray(msg)) {
      for (let i = 0; i < exp.head.length; i++) {
        scope.addSet(exp.head[i].value.value, msg[i].value)
      }
    }
    return evalBodyWithVars(exp.vars, exp.body, scope)
  }
}