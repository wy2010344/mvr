import { EnvModel, GetAstNextTimeWork, TimeWork } from "./commitWork"
import { deepTravelFiber } from "./findParentAndBefore"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
import { EmptyFun } from "wy-helper"

export class Reconcile {
  constructor(
    private rootFiber: Fiber,
    getAsk: GetAstNextTimeWork
  ) {
    this.askToWork = getAsk(this.didRenderWork.bind(this))
  }
  private askToWork: EmptyFun
  requestFlushSync() {
    /**
     * 同步执行完,如果当前正在render,
     * 当然先同步结束当前的render,
     * 仍然要做一次render
     */
    while (true) {
      const work = this.workList.shift()
      if (work) {
        work()
      } else {
        break
      }
    }
  }
  private needRender = false
  requestRender(envModel: EnvModel) {
    if (this.needRender) {
      return
    }
    this.needRender = true
    const that = this
    this.workList.push(function () {
      that.workList.shift()
      that.needRender = false
      that.workLoop(envModel, that.rootFiber)
    })
    this.askToWork()
  }
  private workList: TimeWork[] = []
  private didRenderWork() {
    return this.workList[0]
  }
  private workLoop(
    envModel: EnvModel,
    unitOfWork: Fiber
  ) {
    const that = this
    const nextUnitOfWork = performUnitOfWork(unitOfWork, envModel)
    if (nextUnitOfWork) {
      this.workList.push(function () {
        that.workList.shift()
        that.workLoop(envModel, nextUnitOfWork)
      })
    } else {
      const realWork: TimeWork = function () {
        that.workList.shift()
        envModel.commit(that.rootFiber)
      }
      realWork.isRender = true
      this.workList.unshift(realWork)
    }
  }
  destroy(envModel: EnvModel) {
    const that = this
    if (this.rootFiber) {
      envModel.addDelect(this.rootFiber)
      envModel.updateEffect(0, function () {
        that.rootFiber = undefined!
      })
      this.requestRender(envModel)
    }
  }
}

/**
 * 当前工作结点，返回下一个工作结点
 * 先子，再弟，再父(父的弟)
 * 因为是IMGUI的进化版,只能深度遍历,不能广度遍历.
 * 如果子Fiber有返回值,则是有回流,则对于回流,父组件再怎么处理?像布局,是父组件收到回流,子组件会再render.也许从头绘制会需要这种hooks,只是哪些需要显露给用户
 * 深度遍历,render是前置的,执行完父的render,再去执行子的render,没有穿插的过程,或者后置的处理.亦即虽然子Fiber声明有先后,原则上是可以访问所有父的变量.
 * @param fiber 
 * @returns 
 */
const performUnitOfWork = deepTravelFiber<EnvModel[]>(function (fiber, envModel) {
  //当前fiber脏了，需要重新render
  if (fiber.effectTag) {
    updateFunctionComponent(envModel, fiber)
  }
})