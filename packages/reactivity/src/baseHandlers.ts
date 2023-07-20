import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";

export const mutableHandlers = {
  get(target,key,receiver){
    // 巧妙  当代理过的对象再次进入代理 直接返回true
    if(key === ReactiveFlags.IS_REACTIVE)return true;
    
    track(target,'get',key)

    return Reflect.get(target,key,receiver)
  },
  set(target,key,value,receiver){

    let oldValue = target[key];
    let result = Reflect.set(target,key,value,receiver)
    
    if(oldValue !== value){ //值变化了
      trigger(target,'set',key,value,oldValue) //更新
    }

    return result
  }
}