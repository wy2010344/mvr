import { BQue } from "wy-helper/tokenParser";
import { fixBodyExp, funBodyRule } from "./model";
import { MToken } from "./tokenize";













export function parsePlayground(vs: MToken[]) {
  const out = funBodyRule(new BQue(vs))
  if (out) {
    fixBodyExp(out.value)
    return out.value
  }
}