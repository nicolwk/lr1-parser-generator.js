import { Terminal } from "./symbol";
import { Rule } from "./rule";

export class Item {
  readonly rule: Rule;
  readonly cursor: number;
  readonly lookahead: Terminal;

  constructor(rule: Rule, cursor: number, lookahead: Terminal){
    this.rule = rule;
    this.cursor = cursor;
    this.lookahead = lookahead;
  }

  get_symbol_after_cursor(){
    const rhs = this.rule.rhs;
    return this.cursor < rhs.length ? rhs[this.cursor] : void 0;
  }

  cursor_at_end(){
    return this.cursor >= this.rule.rhs.length;
  }

  next(){
    return new Item(this.rule, this.cursor + 1, this.lookahead);
  }

  key(){
    return `${this.rule.id.toString(16)}:${this.cursor.toString(16)}:${this.lookahead.id.toString(16)}`;
  }

  toString(){
    return `Item(rule: ${this.rule}, cursor: ${this.cursor}, lookahead: ${this.lookahead})`;
  }
}

export class ItemSet {

  readonly items: Map<string, Item>;

  constructor(){
    this.items = new Map();
  }

  add(item: Item){
    const key = item.key();
    if(!this.items.has(key)){
      this.items.set(key, item);
      return true;
    }
    return false;
  }

  key(){
    return [...this.items.keys()].sort().join(';');
  }

  toString(){
    return `ItemSet(items: {${[...this.items.values()].join('\n')}})`;
  }
}