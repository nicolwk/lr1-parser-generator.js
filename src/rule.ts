import { GrammarSymbol, NonTerminal } from "./symbol";

export class Rule {
  readonly id: number;
  readonly lhs: NonTerminal;
  readonly rhs: GrammarSymbol[];
  readonly reducer: Function;
  readonly set_range: boolean;

  constructor(id: number, lhs: NonTerminal, rhs: GrammarSymbol[], reducer: Function, options: RuleOptions){
    this.id = id;
    this.lhs = lhs;
    this.rhs = rhs;
    this.reducer = reducer;
    this.set_range = options?.set_range ?? true;
  }

  toString(){
    return `Rule(id: ${this.id}, lhs: ${this.lhs}, rhs: [${this.rhs.join(', ')}])`;
  }
}

export type RuleOptions = {
  set_range?: boolean
}