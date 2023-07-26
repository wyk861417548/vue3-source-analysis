import { isFunction } from "@vue/shared"
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";

class ComputedRefImpl{
  public effect;
  public _dirty = true; //默认应该取值的时候进行计算
  public __v_isReadonly = true;
  public __v_isRef = true;
  public _value;
  public dep = new Set;
  constructor(public getter,public setter){
    // 我们将用户的getter放到这个effect中，那么属性就会被这个effect收集起来
    this.effect = new ReactiveEffect(getter,()=>{
      // 当依赖的属性变化后，触发属性的set方法从而触发trigger 最后会执行次调度函数
      if(!this._dirty){
        this._dirty = true;
        // 实现触发更新
        console.log('this.dep',this.dep);
        
        triggerEffects(this.dep)
      }
    })
  }

  // 类中的属性访问器 底层就是Object.defineProperty
  get value(){
    // 做依赖收集
    trackEffects(this.dep)
    if(this._dirty){ //如果是脏值
      this._dirty = false;
      this._value = this.effect.run()
    }
    return this._value;
  }

  set value(newValue){
    this.setter(newValue)
  }
}

/**
 * @param getterOrOptions 可以是对象也可以是函数
 */
export const computed = (getterOrOptions)=>{
  const onlyGetter = isFunction(getterOrOptions)
  let getter;
  let setter;
  // debugger
  if(onlyGetter){
    getter = getterOrOptions;
    setter = ()=>{console.log('no set')}
  }else{
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter,setter)
}