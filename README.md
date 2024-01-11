# mvr
a front-end framework

我开始做了better-react这个项目,有感于concurrent模式越来越复杂.
同时联想到div.scrollTop立即触发回流,在原生的开发中,是只有一个单线程的,没有异步.
所以内部以类似scrollTop的访问方式为核心,当访问模型及其外延的计算属性的时候,实时回流,即获得最新值.
以
```typescript
const [getValue,setValue]=useModel(8)
/**
 * or

const [value,setValue,getValue]=useModelState(3)
**/

const getComputedValue=useComputed(function(){
  return getValue()+9
})
/**
 * or

const getComputedValue=useComputed(function(a){
 return a+78
},[getValue]) 
**/
```
为核心.
当在事件中访问```getValue()```或```getComputedValue()```时,会触发回流,从而获得最新值.


出现问题:useModel是触发异步更新,useComputed依赖实时值,并不会触发立即的flushSync,只会在computedValue的内部计算.
由此是否需要hooks?hooks造成整体render与函数的改变(闭包改变)
构建父组件,父组件内部的参数.子组件,但是要动态增加与删除子组件,修改视图上的属性.
函数应该始终在render的外围,只靠参数变化,而不是闭包变化(函数当作数据,需要手动确定其依赖.)
所以组件需要构建在render中.但从入参传递进去的model,也需要在构造时绑定.
事实上仍然只是一个computed

之前实现的错误,memo与context应该与react一样,只是触发render获得最新值.
获得render上的实时值,触发render,是一步flushSync,与一个固定的函数读取最新的值.


当然,触发了过多的回流.

需要更新
  所有