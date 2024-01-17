import { BQue, ParseFunGet, ParserSuccess, Que, alawaysGet, andMatch, andRuleGet, manyRuleGet, match, matchEnd, matchToEnd, matchVS, notMathChar, orMatch, orMatchEmpty, orRuleGet, reduceRuleGet, ruleGet, whiteSpaceRule } from "wy-helper/tokenParser";
import { AssignToken, BindKeyToken, ErrorArea, KeywordToken, MToken, NumberToken, PureToken, StringToken, isPureWord } from "./tokenize";
import { quote } from "wy-helper";

// class TokenNode implements TNode {
//   constructor(
//     begin: ErrorQue,
//     end: ErrorQue
//   ) {
//     this.begin = begin.i
//     this.end = end.i
//     this.value = begin.content.slice(begin.i, end.i)
//   }
//   readonly begin: number
//   readonly end: number
//   readonly value: string
// }

// class MethodOneNode extends TokenNode { }
// class MethodKey extends TokenNode { }
// class MethodParam extends TokenNode { }
class MethodNode {
  constructor(
    public readonly key: BindKeyToken,
    public readonly value: PureToken
  ) { }
}


class ExpMsgNode {
  constructor(
    public readonly key: BindKeyToken,
    public readonly value: Exp
  ) { }
}

/**
 * 消息调用
 */
class CallExp {
  constructor(
    public readonly node: Exp,
    public readonly msg: PureToken | ExpMsgNode[]
  ) { }
}


class StringRestExp {
  constructor(
    public readonly exp: Exp,
    public readonly string: StringToken
  ) { }
}

class StringExp {
  constructor(
    public readonly first: StringToken,
    public readonly rests?: StringRestExp[]
  ) { }
}

type Exp = CallExp | PureToken | NumberToken | StringExp


class AssignExp {
  constructor(
    public readonly name: PureToken,
    public readonly exp: Exp
  ) { }
}


class MethodExp {
  constructor(
    public readonly head: PureToken | MethodNode[],
    public readonly vars: PureToken[] | undefined,
    public readonly body: (Exp | AssignExp)[]
  ) { }

  getSign() {
    if (this.head instanceof PureToken) {
      return this.head.value
    } else {
      return this.head.map(head => {
        return head.key.value
      }).join('')
    }
  }
}

// const orGetWhite = ruleGet(
//   orMatchEmpty(
//     whiteSpaceRule
//   ),
//   quote
// )

type HQue = BQue<MToken, MToken[]>
function matchKeyword(keyword: string) {
  return matchVS<MToken, HQue>(v => {
    return v instanceof KeywordToken && v.value == keyword
  })
}

function getToken(x: HQue) {
  const token = x.content[x.i]
  return token
}

function ruleGetToken<F extends MToken>(call: (token: MToken) => boolean) {
  return ruleGet<HQue, F>(matchVS<MToken, HQue>(call), getToken as any)
}

const ruleGetPure = ruleGetToken<PureToken>(v => v instanceof PureToken)
const ruleGetBindKey = ruleGetToken<BindKeyToken>(v => v instanceof BindKeyToken)
const ruleGetNumber = ruleGetToken<NumberToken>(v => v instanceof NumberToken)

/**
 * 单个值
 */
const getValue = orRuleGet(
  ruleGetPure,
  ruleGetNumber,
  que => getStringTemplate(que),
  que => callGetExpRule(que)
)

const getStrRule = andRuleGet(
  [
    ruleGet(
      orMatch(
        match("'"),
        match('}'),
      ),
      quote
    ),
    manyRuleGet(
      orRuleGet(
        ruleGet(match('\\\\'), v => '\\'),
        ruleGet(match("\\'"), v => "'"),
        ruleGet(match('\\$'), v => "$"),
        ruleGet(notMathChar("'".charCodeAt(0)), function (que) {
          return que.content[que.i]
        })
      ),
      0,
      matchToEnd('${'),
      matchToEnd('${')
    ),
    ruleGet(
      orMatch(
        matchEnd,
        match("'"),
        match('${')
      ),
      quote
    )
  ],
  function (a, b, c) {
    return b.join('')
  }
)
function getString(str: string) {
  const value = getStrRule(new Que(str))
  if (value) {
    return value.value
  }
  return ''
}

const getStringTemplate: ParseFunGet<HQue, StringExp> = orRuleGet(
  ruleGet(matchVS<MToken, HQue>(v => v instanceof StringToken && v.value.startsWith("'") && v.value.endsWith("'")), function (x) {
    const token = x.content[x.i]

    return new StringExp(token)
  }),
  andRuleGet(
    [
      ruleGet(matchVS<MToken, HQue>(v => v instanceof StringToken && v.value.startsWith("'") && v.value.endsWith('${')), function (x) {
        const token = x.content[x.i]
        return token as StringToken
      }),
      manyRuleGet(
        andRuleGet(
          [
            que => expRule(que),
            ruleGet(matchVS<MToken, HQue>(v => v instanceof StringToken && v.value.startsWith("}") && v.value.endsWith("${")), function (x) {
              const token = x.content[x.i]
              return token as StringToken
            })
          ],
          function (a, b) {
            return new StringRestExp(a, b)
          }
        )
      ),
      que => expRule(que),
      ruleGet(matchVS<MToken, HQue>(v => v instanceof StringToken && v.value.startsWith("}") && v.value.endsWith("'")), function (x) {
        const token = x.content[x.i]
        return token as StringToken
      })
    ],
    function (a, b, c, d) {
      return new StringExp(a, [...b, new StringRestExp(c, d)])
    }
  ))
const getMsg = orRuleGet(
  //单值消息
  ruleGetPure,
  manyRuleGet(
    //传值消息
    andRuleGet(
      [
        ruleGetBindKey,
        getValue
      ],
      function (a, b) {
        return new ExpMsgNode(a, b)
      }
    ),
    1
  )
)

const callExpRule: ParseFunGet<HQue, CallExp> = reduceRuleGet(
  andRuleGet(
    [
      //单值
      getValue,
      //消息
      getMsg
    ],
    function (value, msg) {
      return new CallExp(value, msg)
    }
  ),
  //消息
  andRuleGet(
    [
      ruleGet(matchKeyword(','), quote),
      getMsg,
    ],
    function (a, b) {
      return b
    }
  ),
  function (first, rest) {
    return new CallExp(first, rest)
  }
)

const callGetExpRule: ParseFunGet<HQue, CallExp> = andRuleGet(
  [
    ruleGet(matchKeyword('('), quote),
    que => callExpRule(que),
    ruleGet(matchKeyword(')'), quote)
  ],
  function (a, b, c) {
    return b
  }
)

const expRule: ParseFunGet<HQue, Exp> = orRuleGet(
  callExpRule,
  //单值
  getValue
)

const methodRule: ParseFunGet<HQue, MethodExp> = andRuleGet(
  [
    orRuleGet(
      /**形参表 */
      ruleGetPure,
      manyRuleGet(
        andRuleGet(
          [
            ruleGetBindKey,
            ruleGetPure
          ],
          function (a, b) {
            return new MethodNode(a, b)
          }
        )
      )
    ),
    ruleGet(matchKeyword('|'), quote),
    orRuleGet(
      /**内部变量 */
      andRuleGet(
        [
          ruleGet(matchKeyword('|'), quote),
          manyRuleGet(ruleGetPure),
          ruleGet(matchKeyword('|'), quote),
        ],
        function (a, b, c) {
          return b
        }
      ),
      alawaysGet()
    ),
    manyRuleGet(
      orRuleGet(
        andRuleGet(
          [
            ruleGetPure,
            ruleGet(matchVS(v => v instanceof AssignToken), quote),
            expRule
          ],
          function (a, b, c) {
            return new AssignExp(a, c)
          }
        ),
        expRule
      ),
      1,
      matchVS(v => v instanceof KeywordToken && v.value == '.')
    )
  ],
  function (a, b, c, d) {
    return new MethodExp(a, c, d)
  }
)



export function parseMethod(vs: MToken[]) {
  const out = methodRule(new BQue(vs))
  if (out) {
    const m = out.value
    m.body.forEach(b => {
      if (b instanceof AssignExp) {
        circleExp(b.exp)
      } else {
        circleExp(b)
      }
    })
    return m
  }
}

/**
 * CallExp | PureToken | NumberToken | StringExp
 * @param exp 
 */
function circleExp(exp: Exp) {
  if (exp instanceof CallExp) {
    if (exp.msg instanceof PureToken) {
      console.log(exp.msg)
      exp.msg.isMsg = true
    } else {
      exp.msg.forEach(msg => {
        circleExp(msg.value)
      })
    }
  }
}