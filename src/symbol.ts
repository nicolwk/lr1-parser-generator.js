export class GrammarSymbol {
  readonly id: number;
  readonly name: string;

  constructor(id: number, name: string){
    this.id = id;
    this.name = name;
  }
}

export class NonTerminal extends GrammarSymbol {
  toString(){
    return `NonTerminal(id: ${this.id}, name: "${this.name}")`;
  }
}

export class Terminal extends GrammarSymbol {
  toString(){
    return `Terminal(id: ${this.id}, name: "${this.name}")`;
  }
}