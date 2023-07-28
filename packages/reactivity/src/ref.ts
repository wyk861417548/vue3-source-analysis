import { isArray } from "@vue/shared";
import { trackEffects, triggerEffects } from "./effect";
import { toReactive } from "./reactive";

class RefImpl{
  public dep = new Set;
  public _value;
  public __v_isRef = true;
  constructor(public rawValue){
    // 是否是对象 如果是对象那么使用reactive代理，否则直接返回值
    this._value = toReactive(rawValue);
  }

  get value(){
    // 依赖收集
    trackEffects(this.dep)
    return this._value;
  }

  set value(newValue){
    if(newValue !== this.rawValue){
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      // 触发dep中收集的effect 从而更新
      triggerEffects(this.dep)
    }
  }
}

export function ref(value){
  return new RefImpl(value)
}


class ObjectRefImpl{
  constructor(private readonly _object,private readonly _key){}

  get value(){
    return this._object[this._key]
  }

  set value(newVal){
    this._object[this._key] = newVal;
  }
}

/**
 * 只是做了一个简单代理而已（将.value属性代理到原始对象上）
 * @param object 原对象（proxy代理的对象）
 * @param key 目标值
 * @returns 
 */
export function toRef(object,key){
  return new ObjectRefImpl(object,key)
}

/**
 * 只是做了一个简单代理而已（将.value属性代理到原始对象上）
 * @param object 原对象（proxy代理的对象）
 * @returns 
*/
export function toRefs(object){
  const ret = isArray(object)?new Array(object.length):{}
  for (const key in object) {
    ret[key] = toRef(object,key)
  }
  return ret;
}

// 是否是ref
export function isRef(r){
  return !!(r && r.__v_isRef === true)
}

// 如果参数是 ref，则返回内部值，否则返回参数本身
export function unref(ref){
  return isRef(ref)?ref.value:ref;
}

// 反向代理ref（template 里面通过 ref 定义的变量 就是通过这种方式反向代理的 ）
export function proxyRefs(object){
  return new Proxy(object,shallowUnwrapHandlers)  
}

const shallowUnwrapHandlers = {
  get(target,key,receiver){
    let r = Reflect.get(target,key,receiver)
    return unref(r)
  },
  set(target,key,value,receiver){
    let oldValue = target[key];
    if(isRef(oldValue)){
      oldValue.value = value
      return true;
    }else{
      return Reflect.set(target,key,value,receiver)
    }
  }
}