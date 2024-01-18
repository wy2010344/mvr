
import { BQue, ParseFunGet, alawaysGet, andRuleGet, manyRuleGet, orRuleGet, ruleGet } from "wy-helper/tokenParser";
import { MToken, PureToken } from "./tokenize";
import { quote } from "wy-helper";
import { AssignExp, Exp, HQue, MethodNode, fixBodyExp, funBodyRule, matchKeyword, ruleGetBindKey, ruleGetPure } from "./model";


export class MethodExp {
  constructor(
    public readonly head: PureToken | MethodNode[],
    public readonly vars: PureToken[] | undefined,
    public readonly body: (Exp | AssignExp)[]
  ) {
    if (this.head instanceof PureToken) {
      this.sign = this.head.value
    } else {
      this.sign = this.head.map(head => {
        return head.key.value
      }).join('')
    }
  }
  readonly sign: string
}

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
    funBodyRule
  ],
  function (a, b, c, d) {
    return new MethodExp(a, c, d)
  }
)

export function parseMethod(vs: MToken[]) {
  const out = methodRule(new BQue(vs))
  if (out) {
    const m = out.value
    fixBodyExp(m.body)
    return m
  }
}
