import { Que, andMatch, manyMatch, manyRuleGet, match, matchBetween, matchEnd, matchToEnd, notMathChar, orMatch, orMatchEmpty, orRuleGet, ruleGet, ruleStrBetween, whiteSpaceRule } from "wy-helper/tokenParser";
import { getEvalString } from "./stringUtil";

/**
 * 如果冒号开头,从作为域中查找.
 * 如果冒号前有斜线,属于转义,不查询.
 */
const ruleStrBetweenPart = andMatch(
  orMatch(
    match("'"),
    match('}'),
  ),
  manyMatch(
    orMatch(
      match('\\\\'),//+2
      match(`\\'`),//+1
      match('\\$'),//+1
      notMathChar("'".charCodeAt(0)),//+1 可能吃掉$符号
    ),
    0,
    //每次预先检查,符合则跳出.
    matchToEnd('${'),
    matchToEnd('${')
  ),
  //可能结束了,但没有闭合
  orMatch(
    matchEnd,
    match("'"),
    match('${')
  )
)

export abstract class MToken {
  constructor(

    public readonly begin: number,
    public readonly end: number,
    public readonly value: string,
  ) { }
  public readonly errors: string[] = []

  abstract getClassName(): string
}

abstract class SToken extends MToken {
  constructor(
    begin: Que, end: Que
  ) {
    super(
      begin.i, end.i,
      begin.content.slice(begin.i, end.i)
    )
  }
}

class WhiteToken extends SToken {

  getClassName(): string {
    return ''
  }
}
export class PureToken extends SToken {
  isMsg?: boolean
  getClassName(): string {
    if (this.isMsg) {
      return 'keyword'
    }
    return 'variable'
  }
}
export class BindKeyToken extends SToken {
  getClassName(): string {
    return 'keyword'
  }
}
export class BindParamToken extends SToken {
  getClassName(): string {
    return 'variable'
  }
}
export class AssignToken extends SToken {
  getClassName(): string {
    return 'keyword'
  }
}
export class KeywordToken extends SToken {
  getClassName(): string {
    return 'keyword'
  }
}
export class NumberToken extends SToken {

  getClassName(): string {
    return 'number'
  }
  constructor(begin: Que, end: Que) {
    super(begin, end)
    this.number = Number(this.value)
  }
  readonly number: number
}
class UnParsedToken extends MToken {
  getClassName(): string {
    return ''
  }
}


export class StringToken extends SToken {
  getClassName(): string {
    return 'string'
  }
  constructor(begin: Que, end: Que) {
    super(begin, end)
    this.string = getEvalString(this.value)
  }
  readonly string: string
}
class CommentToken extends SToken {
  getClassName(): string {
    return 'comment'
  }
}

export class ErrorArea {
  constructor(
    public readonly begin: number,
    public readonly end: number,
    public readonly message: string
  ) { }
}


export function filterInUserToken(v: MToken) {
  return !(v instanceof UnParsedToken || v instanceof CommentToken || v instanceof WhiteToken)
}


export interface TNode {
  readonly begin: number
  readonly end: number
  readonly value: string
}
export const keywords = ['(', ')', '[', ']', ',', ';', '|', '.']
function getCharCode(n: string) {
  return n.charCodeAt(0)
}
const isNumber = matchBetween<Que>(getCharCode('0'), getCharCode('9'))
const isChinese = matchBetween<Que>(getCharCode('\u4e00'), getCharCode('\u9fa5'))
const isLowerEnglish = matchBetween<Que>(getCharCode('a'), getCharCode('z'))
const isUpperEnglish = matchBetween<Que>(getCharCode('A'), getCharCode('Z'))


export const isPureWord = andMatch(
  orMatch(
    isUpperEnglish,
    isLowerEnglish,
    isChinese
  ),
  manyMatch(
    orMatch(
      isUpperEnglish,
      isLowerEnglish,
      isChinese,
      isNumber
    )
  )
)

const isInt = orMatch(
  andMatch(
    matchBetween(getCharCode('1'), getCharCode('9')),
    manyMatch(
      isNumber
    )
  ),
  isNumber
)
const isFloat = andMatch(
  isInt,
  orMatchEmpty(
    andMatch(
      match('.'),
      manyMatch(isNumber, 1)
    )
  )
)

/**
 * 参数中
 * subStr: a svv: b
 */
const isKeyBind = andMatch(
  isPureWord,
  match(':')
)

/**
 * lambda中
 * :a :b
 */
const isParamBind = andMatch(
  match(':'),
  isPureWord,
)


const isKeyWord = match<Que>(...keywords)

const sentenceRule = manyRuleGet<Que, SToken>(
  orRuleGet(
    ruleGet(ruleStrBetween('"'), function (begin, end) {
      const token = new CommentToken(begin, end)
      if (!token.value.endsWith('"')) {
        token.errors.push('未结束注释')
      }
      return token
    }),
    ruleGet(ruleStrBetweenPart, function (begin, end) {
      const token = new StringToken(begin, end)
      if (!token.value.endsWith("'") && !token.value.endsWith('${')) {
        token.errors.push('未结束的字符串')
      }
      return token
    }),
    ruleGet(isParamBind, function (begin, end) {
      return new BindParamToken(begin, end)
    }),
    ruleGet(match(':='), function (begin, end) {
      return new AssignToken(begin, end)
    }),
    ruleGet(whiteSpaceRule, function (begin, end) {
      return new WhiteToken(begin, end)
    }),
    ruleGet(isKeyBind, function (begin, end) {
      return new BindKeyToken(begin, end)
    }),
    ruleGet(isPureWord, function (begin, end) {
      return new PureToken(begin, end)
    }),
    ruleGet(isFloat, function (begin, end) {
      return new NumberToken(begin, end)
    }),
    ruleGet(isKeyWord, function (begin, end) {
      return new KeywordToken(begin, end)
    })
  )
)


export function tokenize(content: string): SToken[] {
  const result = sentenceRule(new Que(content))
  if (result) {

    if (result.end.i != content.length) {
      const token = new UnParsedToken(
        result.end.i,
        content.length,
        result.end.content.slice(result.end.i, content.length),
      )
      token.errors.push('无法正常解析')
      return [
        ...result.value,
        token
      ]
    }
    return result.value
  } else {
    if (content) {
      const token = new UnParsedToken(
        0,
        content.length,
        content
      )
      token.errors.push('无法正常解析')
      return [
        token
      ]
    }
  }
  return []
}