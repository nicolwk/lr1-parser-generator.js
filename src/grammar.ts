import { GrammarSymbol, Terminal, NonTerminal } from "./symbol";
import { Rule } from "./rule";
import { Item, ItemSet } from "./item";
import { Action, State } from "./state";

export function get_grammar_states(args: {rules: Rule[], start_symbol: NonTerminal, end_symbol: Terminal}){
  const rules_by_lhs = group_rules_by_lhs(args.rules);
  const empty_symbols = get_empty_symbols(rules_by_lhs);
  const first_sets = make_first_sets(rules_by_lhs, empty_symbols);

  let next_state_id = 0;

  const queue: {items: ItemSet, state: State}[] = [];
  const new_sets = new Map<GrammarSymbol, ItemSet>();

  const start_set = make_start_set(rules_by_lhs, empty_symbols, first_sets, args.start_symbol, args.end_symbol);
  const start_state = new State(next_state_id++);

  queue.push({items: start_set, state: start_state});
  const item_set_to_state = new Map([[start_set.key(), start_state]]);
  const states = [start_state];

  while(queue.length > 0){
    const {items: set, state} = queue.shift();
    new_sets.clear();
    make_new_sets(set, rules_by_lhs, empty_symbols, first_sets, new_sets);
    const actions = new Map<GrammarSymbol, Action>();
    for(const [symbol, set] of new_sets){
      const items_key = set.key();
      if(!item_set_to_state.has(items_key)){
        const new_state = new State(next_state_id++);
        queue.push({items: set, state: new_state});
        item_set_to_state.set(items_key, new_state);
        states.push(new_state);
        actions.set(symbol, new Action(new_state));
      }else{
        actions.set(symbol, new Action(item_set_to_state.get(items_key)));
      }
    }
    for(const i of set.items.values()){
      if(i.cursor_at_end()){
        const action = actions.get(i.lookahead);
        if(action != null){
          console.log(i.toString());
          console.log(action.toString());
          throw 'conflict';
        }
        actions.set(i.lookahead, new Action(i.rule));
      }
    }
    state.actions = actions;
  }

  return states;
}

function group_rules_by_lhs(rules: Rule[]){
  const grouped = new Map<NonTerminal, Rule[]>();
  for(const rule of rules){
    let rules = grouped.get(rule.lhs);
    if(rules == null){
      rules = [];
      grouped.set(rule.lhs, rules);
    }
    rules.push(rule);
  }
  return grouped;
}

function get_empty_symbols(rules_by_lhs: Map<NonTerminal, Rule[]>){
  const empty_symbols = new Set<NonTerminal>();
  let dirty = true;
  while(dirty){
    dirty = false;
    for(const [lhs, rules] of rules_by_lhs){
      if(empty_symbols.has(lhs)) continue;

      for(const rule of rules){
        let all_empty = true;
        for(const symbol of rule.rhs){
          if(!empty_symbols.has(symbol)){
            all_empty = false;
            break;
          }
        }
        if(all_empty){
          dirty = true;
          empty_symbols.add(lhs);
          break;
        }
      }
    }
  }
  return empty_symbols;
}

function make_first_sets(rules_by_lhs: Map<NonTerminal, Rule[]>, empty_symbols: Set<NonTerminal>){
  const first_sets = new Map<NonTerminal, Set<Terminal>>();
  for(const lhs of rules_by_lhs.keys()){
    const visited = new Set<NonTerminal>();
    const results = new Set<Terminal>();
    const queue: NonTerminal[] = [];
    queue.push(lhs);
    visited.add(lhs);
    while(queue.length > 0){
      const nt = queue.shift();
      for(const rule of rules_by_lhs.get(nt)){
        for(const s of rule.rhs){
          if(s instanceof Terminal){
            results.add(s);
            break;
          }else{
            if(!visited.has(s)){
              queue.push(s);
              visited.add(s);
            }
            if(!empty_symbols.has(s)) break;
          }
        }
      }
    }
    first_sets.set(lhs, results);
  }
  return first_sets;
}

function make_start_set(rules_by_lhs: Map<NonTerminal, Rule[]>, empty_symbols: Set<NonTerminal>, first_sets: Map<NonTerminal, Set<Terminal>>, start_symbol: NonTerminal, end_symbol: Terminal){
  const start_rules = rules_by_lhs.get(start_symbol);
  if(start_rules == null) throw 'no rules for start symbol';
  const set = new ItemSet();
  for(const rule of start_rules){
    set.add(new Item(rule, 0, end_symbol));
  }
  close_set(set, rules_by_lhs, empty_symbols, first_sets);
  return set;
}

function make_new_sets(set: ItemSet, rules_by_lhs: Map<NonTerminal, Rule[]>, empty_symbols: Set<NonTerminal>, first_sets: Map<NonTerminal, Set<Terminal>>, results: Map<GrammarSymbol, ItemSet>){
  for(const item of set.items.values()){
    const s = item.get_symbol_after_cursor();
    if(s == null) continue;
    let new_set = results.get(s);
    if(new_set == null){
      new_set = new ItemSet();
      results.set(s, new_set);
    }
    new_set.add(item.next());
  }
  for(const set of results.values()){
    close_set(set, rules_by_lhs, empty_symbols, first_sets);
  }
}

function close_set(set: ItemSet, rules_by_lhs: Map<NonTerminal, Rule[]>, empty_symbols: Set<NonTerminal>, first_sets: Map<NonTerminal, Set<Terminal>>){
  const visited = new Map<string, {nt: NonTerminal, lookahead: Terminal}>();
  const item_queue = [...set.items.values()];
  while(item_queue.length > 0){
    const item = item_queue.shift();
    const s = item.get_symbol_after_cursor();
    if(s == null || s instanceof Terminal) continue;
    const nt = s as NonTerminal;
    const lookahead_set = new Set<Terminal>();
    const rule_size = item.rule.rhs.length;
    for(let i = item.cursor + 1; i <= rule_size; i++){
      if(i < rule_size){
        const s = item.rule.rhs[i];
        if(s instanceof Terminal){
          lookahead_set.add(s);
          break;
        }else{
          for(const t of first_sets.get(s)){
            lookahead_set.add(t);
          }
          if(!empty_symbols.has(s)) break;
        }
      }else{
        lookahead_set.add(item.lookahead);
      }
    }
    for(const t of lookahead_set){
      const key = `${nt.id.toString(16)},${t.id.toString(16)}`;
      if(!visited.has(key)){
        visited.set(key, {nt, lookahead: t});
        for(const r of rules_by_lhs.get(nt)){
          const new_item = new Item(r, 0, t);
          if(set.add(new_item)){
            if(!new_item.cursor_at_end()) item_queue.push(new_item);
          }
        }
      }
    }
  }
}