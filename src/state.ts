import { GrammarSymbol } from './symbol';
import { Rule } from './rule';

export const ACTION_SHIFT  = 1;
export const ACTION_REDUCE = 2;
export const ACTION_ACCEPT = 3;

export class Action {
  readonly type: number;
  readonly state: State;
  readonly rule: Rule;

  constructor(arg: number|State|Rule){
    if(arg instanceof State){
      this.type = ACTION_SHIFT;
      this.state = arg;
    }else if(arg instanceof Rule){
      this.type = ACTION_REDUCE;
      this.rule = arg;
    }else{
      this.type = arg;
    }
  }

  toString(){
    return `${this.type === ACTION_SHIFT ? 'SHIFT ' : this.type === ACTION_REDUCE ? 'REDUCE ' : this.type === ACTION_ACCEPT ? 'ACCEPT' : ''}${this.rule ?? ''}${this.state ?? ''})`;
  }
}

export class State {
  readonly id: number;
  actions: Map<GrammarSymbol, Action>;

  constructor(id: number){
    this.id = id;
    this.actions = new Map();
  }

  toString(){
    return `State(id: ${this.id})`;
  }
}