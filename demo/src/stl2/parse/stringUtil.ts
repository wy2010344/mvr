import { BQue, ParseFunGet, Que, alawaysGet, andRuleGet, manyRuleGet, match, matchEnd, matchToEnd, matchVS, notMathChar, orMatch, orRuleGet, reduceRuleGet, ruleGet } from "wy-helper/tokenParser";
import { AssignToken, BindKeyToken, KeywordToken, MToken, NumberToken, PureToken, StringToken } from "./tokenize";
import { quote } from "wy-helper";

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
export function getEvalString(str: string) {
  const value = getStrRule(new Que(str))
  if (value) {
    return value.value
  }
  return ''
}
