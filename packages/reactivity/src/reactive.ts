import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers";

export const enum ReactiveFlags{
  IS_REACTIVE = '__v_isReactive',
}

const proxyMap = new WeakMap();// 使用弱引用来存储 proxy 代理的对象

// 为什么不用 target[key] 取值,是因为当属性变化后检测不到
export function reactive(target){
  if(!isObject(target))return;

  // 巧妙 如果这个对象被代理过了 当上面判断取值的时候会走到这 返回true 证明是被代理过的对象
  if(target[ReactiveFlags.IS_REACTIVE])return target;

  // 如果已经代理过了  直接返回
  const existingProxy = proxyMap.get(target)
  if(existingProxy)return existingProxy;

  const proxy = new Proxy(target,mutableHandlers)

  proxyMap.set(target,proxy)

  return proxy;
}


/** 检查一个对象是否是由 reactive()或 shallowReactive() 创建的代理。
 * @param value 
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#isreactive}
 * "!!"是一个逻辑运算符的组合，用于将一个值转换为相应的布尔值。它通常用于将一个值显式地转换为布尔值，并返回该布尔值。
 */
export function isReactive(value){
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

/**
 * 检查是否是对象 如果是对象那么使用reactive代理，否则直接返回值
 * @param value 
 * @returns 
 */
export function toReactive(value){
  return isObject(value)?reactive(value):value;
}