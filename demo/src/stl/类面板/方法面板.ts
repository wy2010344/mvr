import { dom } from "mvr-dom";
import { renderInput } from "mvr-dom-helper";
import { renderArray, renderIf, useBuildSubSetArray, useBuildSubSetObject, useMemo, useModel, useModelValue } from "mvr-helper";
import { RWValue, emptyArray, quote, run } from "wy-helper";

import { BQue, BaseQue, Que, andMatch, andRuleGet, manyMatch, manyRuleGet, match, matchBetween, matchEnd, matchVS, orMatch, orRuleGet, ruleGet, whiteSpaceRule } from 'wy-helper/tokenParser'
import { Method } from "../model";
import { cns, cssMap } from "wy-dom-helper";
export function render方法面板({
  methods
}: {
  methods: RWValue<Method[]>
}) {
  dom.div({
    style: `
    flex:1;
    `
  }).render(function () {
    const inputValue = useModelValue('')

    const { inputSign } = useMemo(() => {
      const tokens = tokenize(inputValue.value)
      let inputSign = ''
      if (tokens.length) {
        const sentence = parse(tokens)
        if (sentence) {
          inputSign = getSign(sentence)
        }
      }
      return {
        inputSign
      }
    }, [inputValue.value])


    const asts = useMemo(() => {
      return methods.value.map(value => {
        let sign = ''
        const tokens = tokenize(value.title)
        if (tokens.length) {
          const sentence = parse(tokens)
          if (sentence) {
            sign = getSign(sentence)
          }
        }
        return {
          ...value,
          sign
        }
      })
    }, [methods.value])

    const { filterItems, matchItem } = useMemo(() => {
      let matchItem: typeof asts[0] | undefined = undefined
      let filterItems = asts
      if (inputSign) {
        filterItems = asts.filter(function (value) {
          if (value.sign && value.sign.startsWith(inputSign)) {
            if (value.sign == inputSign) {
              matchItem = value
            }
            return true
          }
          return false
        })
      }
      return {
        filterItems,
        matchItem
      }
    }, [inputSign, asts])
    console.log("ddd", asts)
    dom.div({
      style: `
      flex:1;
      `
    }).render(function () {
      //右边
      dom.div({
        style: `
        display:flex;
        align-items:center;
        height:30px;
        `
      }).render(function () {
        //头部
        renderInput("input", {
          style: `
          flex:1;
          `,
          placeholder: '请输入方法名字',
          value: inputValue.value,
          onValueChange(v) {
            inputValue.value = v
            const tokens = tokenize(v)
            const sentence = parse(tokens)
            console.log(sentence)
          },
        })
        renderIf(inputValue.value, function () {
          dom.button({
            onClick() {
              inputValue.value = ''
            }
          }).text`删除`
        })
        renderIf(!matchItem && inputValue.value, function () {
          dom.button({
            onClick() {
              methods.value = [
                {
                  title: inputValue.value,
                  body: ''
                },
                ...methods.value || emptyArray
              ]
              // addModel(inputValue.value)
              inputValue.value = ''
            }
          }).text`增加`
        })
      })

      dom.div({}).render(function () {
        dom.table({
          style: `
          width:100%
          `
        }).render(function () {
          renderArray(filterItems, v => v.sign || v.title, function (model) {
            const expand = useModelValue(false)
            const [methodValue] = useBuildSubSetArray(methods, model, v => v.title)
            dom.tr({
              className: cls.clsRow,
            }).render(function () {
              dom.td().text`${model.title}`
              dom.td({
                style: `
                width:30px;
                `
              }).render(function () {
                dom.button({
                  onClick() {
                    expand.value = !expand.value
                  }
                }).text`${expand.value ? '-' : '+'}`
              })
            })
            renderIf(expand.value, function () {
              dom.tr().render(function () {
                dom.td({
                  colSpan: 2
                }).render(function () {
                  renderInput("textarea", {
                    style: `
                    width:100%;
                    `,
                    value: model.body,
                    onValueChange(v) {
                      methodValue.value.body = v
                    },
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}
const cls = cssMap({
  clsRow: `
  &:hover{
    background:aliceblue;
  }
  &.selected{
    background:aquamarine;
  }
  `
})
function getCharCode(n: string) {
  return n.charCodeAt(0)
}

const isNumber = matchBetween(getCharCode('0'), getCharCode('9'))
const isChinese = matchBetween(getCharCode('\u4e00'), getCharCode('\u9fa5'))
const isLowerEnglish = matchBetween(getCharCode('a'), getCharCode('z'))
const isUpperEnglish = matchBetween(getCharCode('A'), getCharCode('Z'))

/**
 * 纯symbol
 */
const isPureWord = andMatch(
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

/**
 * 绑定变量
 */
const isBindWord = andMatch(
  match(':'),
  isPureWord
)

const isAtWord = andMatch(
  match('@'),
  isPureWord
)
type SToken = {
  type: "white" | "pure" | "bind" | "at",
  begin: number,
  end: number,
  value: string
  errors: string[]
}

const sentenceRule = andRuleGet(
  [
    manyRuleGet<Que, SToken>(
      orRuleGet(
        ruleGet(whiteSpaceRule, function (begin, end) {
          return {
            type: "white",
            begin: begin.i,
            end: end.i,
            value: begin.content.slice(begin.i, end.i),
            errors: []
          }
        }),
        ruleGet(isPureWord, function (begin, end) {
          return {
            type: "pure",
            begin: begin.i,
            end: end.i,
            value: begin.content.slice(begin.i, end.i),
            errors: []
          }
        }),
        ruleGet(isBindWord, function (begin, end) {
          return {
            type: "bind",
            begin: begin.i,
            end: end.i,
            value: begin.content.slice(begin.i, end.i),
            errors: []
          }
        }),
        ruleGet(isAtWord, function (begin, end) {
          return {
            type: "at",
            begin: begin.i,
            end: end.i,
            value: begin.content.slice(begin.i, end.i),
            errors: []
          }
        })
      )
    ),
    ruleGet(matchEnd, quote)
  ],
  function (a, b) {
    return a
  }
)


function tokenize(content: string) {
  const result = sentenceRule(new Que(content))
  if (result) {
    return result.value
  } else {
    return []
  }
}


type Sentence = {
  args: {
    type: 'name' | 'bind'
    value: string
  }[]
  ext?: {
    type: "map"
    value: string
  } | {
    type: "list"
    value: string
  }
}

type HQue = BaseQue<SToken, SToken[]>

const matchPure = matchVS<SToken, HQue>(v => {
  return v.type == 'pure'
})
const matchBind = matchVS<SToken, HQue>(v => {
  return v.type == 'bind'
})
const matchAt = matchVS<SToken, HQue>(v => {
  return v.type == 'at' && (v.value == '@map' || v.value == '@list')
})

const sentenceRulePlus = andRuleGet(
  [
    manyRuleGet(
      orRuleGet(
        ruleGet(matchPure, function (x) {
          const token = x.content[x.i]
          return {
            type: "name",
            value: token.value
          } as const
        }),
        ruleGet(matchBind, function (x) {
          const token = x.content[x.i]
          return {
            type: "bind",
            value: token.value.slice(1)
          } as const
        }),
      )
    ),
    orRuleGet(
      ruleGet(
        matchEnd,
        function () {
          return undefined
        }
      ),
      andRuleGet(
        [
          ruleGet(matchAt, function (x) {
            const token = x.content[x.i]
            return token.value.slice(1)
          }),
          ruleGet(matchBind, function (x) {
            const token = x.content[x.i]
            return token.value.slice(1)
          }),
          ruleGet<BaseQue<SToken, SToken[]>, string>(matchEnd, function (x) {
            return ''
          })
        ],
        function (a, b) {
          return {
            type: a as 'map',
            value: b
          }
        }
      )
    )
  ],
  function (a, b) {
    return {
      args: a,
      ext: b
    } as Sentence
  }
)


function parse(tokens: SToken[]) {
  const result = sentenceRulePlus(new BQue(tokens.filter(v => v.type != 'white')))
  if (result) {
    return result.value
  }
}


function getSign(sentence: Sentence) {
  let inputSign = sentence.args.map(v => {
    if (v.type == 'bind') {
      return ':'
    } else {
      return v.value
    }
  }).join('_')
  if (sentence.ext) {
    inputSign += '@' + sentence.ext.type + ':'
  }
  return inputSign
}