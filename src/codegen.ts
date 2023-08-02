import * as fs from 'fs';

import * as acorn from 'acorn';
import * as astring from 'astring';
import ts from 'typescript';

import { NonTerminal, Terminal } from './symbol';
import { Rule, RuleOptions } from './rule';
import { ACTION_SHIFT } from './state';
import { get_grammar_states } from './grammar';
import { literal, array, property } from './astring-helper';

export function generate_parser(conf: {start_symbol: string}, cb: (args: {
  r: (lhs: string, rhs: (Terminal|string)[], reducer?: (...args: any[]) => any, options?: RuleOptions) => void,
  t: (token: string) => Terminal,
  k: (token: string) => Terminal,
  nt: (name: string) => NonTerminal,
  custom_terminal: (name: string) => Terminal
}) => void){

  let next_symbol_id = 0;
  let next_rule_id = 0;

  const END = new Terminal(next_symbol_id++, 'END');

  const non_terminals    = new Map<string, NonTerminal>();
  const tokens           = new Map<string, Terminal>();
  const keywords         = new Map<string, Terminal>();
  const symbol_ids       = new Map<string, number>();
  const custom_terminals = new Map<string, Terminal>();

  const rules: Rule[] = [];

  function nt(name: string){
    let nt = non_terminals.get(name);
    if(nt == null){
      nt = new NonTerminal(next_symbol_id++, name);
      non_terminals.set(name, nt);
    }
    return nt;
  }

  function get_rhs_symbol(name: string){
    const t = custom_terminals.get(name);
    if(t != null) return t;

    let nt = non_terminals.get(name);
    if(nt == null){
      nt = new NonTerminal(next_symbol_id++, name);
      non_terminals.set(name, nt);
    }
    return nt;
  }

  cb({
    r: (lhs, rhs, reducer, options) => {
      rules.push(new Rule(next_rule_id++, nt(lhs), rhs.map(s => typeof s === 'string' ? get_rhs_symbol(s) : s), reducer, options));
    },
    t: (name: string) => {
      let t = tokens.get(name);
      if(t == null){
        t = new Terminal(next_symbol_id++, name);
        tokens.set(name, t);
        symbol_ids.set(name, t.id);
      }
      return t;
    },
    k: (name: string) => {
      let t = keywords.get(name);
      if(t == null){
        t = new Terminal(next_symbol_id++, name);
        keywords.set(name, t);
        symbol_ids.set(name, t.id);
      }
      return t;
    },
    nt,
    custom_terminal: (name: string) => {
      const t = new Terminal(next_symbol_id++, name);
      custom_terminals.set(name, t);
      symbol_ids.set(name, t.id);
      return t;
    }
  });

  const states = get_grammar_states({rules, start_symbol: nt(conf.start_symbol), end_symbol: END});

  function transpile(path: string): string{
    return ts.transpileModule(fs.readFileSync(path, {encoding: 'utf-8'}), {
      compilerOptions: {
        moduleResolution: ts.ModuleResolutionKind.Node16, lib: ['lib.es2020.d.ts'], module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020
      }
    }).outputText;
  }

  fs.writeFileSync('./dist/index.js', fs.readFileSync('./_dist/index.js', {encoding: 'utf-8'}), {encoding: 'utf-8'});

  const rules_file_ast: any = acorn.parse(transpile('./src/rules.ts'), {ecmaVersion: 2020, sourceType: 'module'});
  const rules_file_export_ast = rules_file_ast.body.find(stmt => stmt.type === 'ExportDefaultDeclaration');
  rules_file_export_ast.declaration = array(rules_file_export_ast.declaration.body.elements);
  const rules_ast = rules_file_export_ast.declaration.elements as {elements: any[]}[];
  for(let i = 0; i < rules_ast.length; i++){
    const rule = rules_ast[i];
    rule.elements[0] = literal(rules[i].lhs.id);
    rule.elements[1] = literal(rules[i].rhs.length);
    if(rules[i].set_range === false){
      rule.elements[3] = literal(0);
    }
  }
  fs.writeFileSync('./dist/rules.js', astring.generate(rules_file_ast));


  const body: any[] = [{
    type: "ExportDefaultDeclaration",
    declaration: {
      type: "ObjectExpression",
      properties: [
        property("states", array(states.map(state => {
          const shift_entries = [...state.actions].filter(([symbol, action]) => action.type === ACTION_SHIFT);
          const reduce_entries = new Map<number, number[]>();
          for(const [{id: symbol_id}, {rule}] of state.actions){
            if(rule == null) continue;
            let symbols = reduce_entries.get(rule.id);
            if(symbols == null) reduce_entries.set(rule.id, symbols = []);
            symbols.push(symbol_id);
          }
          return array([
            shift_entries.length > 0 ? array(shift_entries.flatMap(([symbol, action]) => [
              literal(symbol.id),
              literal(action.state.id)
            ])) : void 0,
            reduce_entries.size > 0 ? array([...reduce_entries].flatMap(([rule_id, symbol_ids]) => [
              symbol_ids.length > 1 ? array(symbol_ids.map(id => literal(id))) : literal(symbol_ids[0]),
              literal(rule_id)
            ])) : void 0
          ]);
        }))),
        property("start_symbol_rules", array(rules.filter(rule => rule.lhs.id === non_terminals.get(conf.start_symbol).id).map(rule => literal(rule.id)))),
        property("tokens"            , array([...tokens    .keys()].sort().map(t => literal(t)))),
        property("keywords"          , array([...keywords  .keys()].sort().map(t => literal(t)))),
        property("symbol_ids"        , array([...symbol_ids.keys()].sort().map(t => array([literal(t), literal(symbol_ids.get(t))])))),
      ]
    }
  }];

  const node = {
    type: "Program",
    body,
    sourceType: "module"
  };

  fs.writeFileSync('./dist/spec.js', astring.generate(node), {encoding: 'utf-8'});
}
