import { ReactiveFlags } from "./reactive";

export const mutableHandlers = {
  get(target,key,receiver){
    // 巧妙  当代理过的对象再次进入代理 直接返回true
    if(ReactiveFlags.IS_REACTIVE)return true;

    return Reflect.get(target,key,receiver)
  },
  set(target,key,value,receiver){
    return Reflect.set(target,key,value,receiver)
  }
}