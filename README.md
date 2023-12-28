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