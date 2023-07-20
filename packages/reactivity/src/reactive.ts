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