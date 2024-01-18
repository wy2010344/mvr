import { BQue, alawaysGet, andRuleGet, orRuleGet, ruleGet } from "wy-helper/tokenParser";
import { BindKeyToken, MToken, PureToken } from "./tokenize";
import { BlockExp, fixBodyExp, getBlockRule, ruleGetPure, ruleGetToken } from "./model";







export class InitExp {
  constructor(
    public readonly extend: PureToken,
    public readonly init?: BlockExp
  ) { }
}

const initRule = andRuleGet(
  [
    ruleGetToken(v => {
      return v instanceof BindKeyToken && v.value == 'extend:'
    }),
    ruleGetPure,
    orRuleGet(
      andRuleGet(
        [
          ruleGetToken(v => {
            return v instanceof BindKeyToken && v.value == 'init:'
          }),
          que => getBlockRule(que)
        ],
        function (a, b) {
          return b
        }
      ),
      alawaysGet()
    )
  ],
  function (a, b, c) {
    return new InitExp(b, c)
  }
)

export function parseInit(vs: MToken[]) {
  const v = initRule(new BQue(vs))
  if (v) {
    const init = v.value.init
    if (init) {
      fixBodyExp(init.body)
    }
    return v.value
  }
}