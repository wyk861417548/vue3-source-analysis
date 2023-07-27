import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

/**
 * 遍历传入的对象 触发属性的get方法 进行依赖收集
 * @param value
 * @param set 考虑如果对象中有循环引用的问题
*/
function traverse(value,set = new Set){
  // 如果不是对象不在递归
  if(!isObject(value))return value;

  if(set.has(value))return value;
  set.add(value)

  for (const key in value) {
    traverse(value[key],set)
  }
  return value;
}

/**
 * @param sources 用户传入的函数or响应式对象
 * @param cb 回调函数
 * @param options 用户传入的参数
 * watch https://cn.vuejs.org/api/reactivity-core.html#watch
 */
export function watch(sources,cb,options){
  let getter;

  //sources不管是对象还是函数 getter 最终是 ()=>sources 
  if(isReactive(sources)){
    //对象：调用traverse递归遍历对象上的属性，触发属性的get方法进行依赖收集
    getter = ()=>traverse(sources)
  }else if(isFunction(sources)){
    //函数：()=>sources 会在首次oldValue = effect.run()执行的时候，执行该函数，从而触发属性的get方法进行依赖收集
    getter = sources
  }else{return}

  let cleanup;

  // onCleanup：副作用清除，该回调函数会在副作用下一次重新执行前调用
  const onCleanup = (fn)=>{
    cleanup = fn; //保存用户的函数
  }

  let oldValue;
  const job = () => {
    if(cleanup)cleanup(); //下次watch触发，清理上次的watch的清理
    let newValue = effect.run()
    cb(newValue,oldValue,onCleanup)
    oldValue = newValue
  }

  // 创建 watch 的effect 
  const effect = new ReactiveEffect(getter,job)
  oldValue = effect.run()
}