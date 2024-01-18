import { BQue, ParseFunGet, Que, alawaysGet, andRuleGet, manyRuleGet, match, matchEnd, matchToEnd, matchVS, notMathChar, orMatch, orRuleGet, reduceRuleGet, ruleGet } from "wy-helper/tokenParser";
import { AssignToken, BindKeyToken, BindParamToken, KeywordToken, MToken, NumberToken, PureToken, StringToken } from "./tokenize";
import { quote } from "wy-helper";

export class MethodNode {
  constructor(
    public readonly key: BindKeyToken,
    public readonly value: PureToken
  ) { }
}


export class ExpMsgNode {
  constructor(
    public readonly key: BindKeyToken,
    public readonly value: Exp
  ) { }
}

/**
 * 消息调用
 */
export class CallExp {
  constructor(
    public readonly node: Exp,
    public readonly msg: (PureToken | ExpMsgNode[])[][]
  ) { }
}


export class StringRestExp {
  constructor(
    public readonly exp: Exp,
    public readonly string: StringToken
  ) { }
}

export class StringExp {
  constructor(
    public readonly first: StringToken,
    public readonly rests?: StringRestExp[]
  ) { }
}

export type Exp = CallExp | PureToken | NumberToken | StringExp | BlockExp


export class AssignExp {
  constructor(
    public readonly name: PureToken,
    public readonly exp: Exp
  ) { }
}


export class BlockExp {
  constructor(
    public readonly params: BindParamToken[] | undefined,
    public readonly vars: PureToken[] | undefined,
    public readonly body: (Exp | AssignExp)[]
  ) { }
}


export type HQue = BQue<MToken, MToken[]>
export function matchKeyword(keyword: string) {
  return matchVS<MToken, HQue>(v => {
    return v instanceof KeywordToken && v.value == keyword
  })
}

function getToken(x: HQue) {
  const token = x.content[x.i]
  return token
}

export function ruleGetToken<F extends MToken>(call: (token: MToken) => boolean) {
  return ruleGet<HQue, F>(matchVS<MToken, HQue>(call), getToken as any)
}

export const ruleGetPure = ruleGetToken<PureToken>(v => v instanceof PureToken)
export const ruleGetBindKey = ruleGetToken<BindKeyToken>(v => v instanceof BindKeyToken)
const ruleGetNumber = ruleGetToken<NumberToken>(v => v instanceof NumberToken)

/**
 * 单个值
 */
const getValue = orRuleGet(
  ruleGetPure,
  ruleGetNumber,
  que => getStringTemplate(que),
  que => callGetExpRule(que),
  que => getBlockRule(que)
)

const ruleBindParam = ruleGetToken<BindParamToken>(v => v instanceof BindParamToken)

export const getBlockRule: ParseFunGet<HQue, BlockExp> = andRuleGet(
  [
    ruleGet(matchKeyword('['), quote),
    orRuleGet(
      //参数表
      andRuleGet(
        [
          manyRuleGet(
            ruleBindParam,
            1
          ),
          ruleGet(matchKeyword('|'), quote)
        ],
        quote
      ),
      alawaysGet()
    ),
    orRuleGet(
      andRuleGet([
        ruleGet(matchKeyword('|'), quote),
        manyRuleGet(
          ruleGetPure,
          1
        ),
        ruleGet(matchKeyword('|'), quote)
      ], function (a, b, c) {
        return b
      }),
      alawaysGet()
    ),
    que => funBodyRule(que),
    ruleGet(matchKeyword(']'), quote)
  ],
  function (a, b, c, d) {
    return new BlockExp(b, c, d)
  }
)

const getStringTemplate: ParseFunGet<HQue, StringExp> = orRuleGet(
  ruleGet(matchVS<MToken, HQue>(v => v instanceof StringToken && v.value.startsWith("'") && v.value.endsWith("'")), function (x) {
    const token = x.content[x.i] as StringToken
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

// const callExpRule: ParseFunGet<HQue, CallExp> = reduceRuleGet(
//   andRuleGet(
//     [
//       //单值
//       getValue,
//       //消息
//       getMsg
//     ],
//     function (value, msg) {
//       return new CallExp(value, msg)
//     }
//   ),
//   //消息
//   andRuleGet(
//     [
//       ruleGet(matchKeyword(','), quote),
//       getMsg,
//     ],
//     function (a, b) {
//       return b
//     }
//   ),
//   function (first, rest) {
//     return new CallExp(first, rest)
//   }
// )

const callExpRule: ParseFunGet<HQue, CallExp> = andRuleGet(
  [
    getValue,
    manyRuleGet(
      manyRuleGet(
        getMsg,
        1,
        matchKeyword(',')
      ),
      1,
      matchKeyword(';')
    )
  ],
  function (first, rest) {
    return new CallExp(first, rest)
  }
)
/**
 * 括号包含的优先级
 */
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

export const funBodyRule = manyRuleGet(
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

/**
 * CallExp | PureToken | NumberToken | StringExp
 * @param exp 
 */
function circleFixExp(exp: Exp) {
  if (exp instanceof CallExp) {
    exp.msg.forEach(msg => {
      msg.forEach(v => {
        if (v instanceof PureToken) {
          v.isMsg = true
        } else {
          v.forEach(x => {
            circleFixExp(x.value)
          })
        }
      })
    })
  }
}

export function fixBodyExp(list: (Exp | AssignExp)[]) {
  list.forEach(b => {
    if (b instanceof AssignExp) {
      circleFixExp(b.exp)
    } else {
      circleFixExp(b)
    }
  })
}