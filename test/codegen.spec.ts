import fs from 'fs';

import { assert } from "chai";

import { generate_parser } from '../src/index';

import { default as rules_1 } from './cases/1';
import { default as rules_calc } from './cases/calculator';

describe("LR1 parser codegen", () => {

  function run(name: string, rules: any){
    const result = generate_parser(
      read_text_file(`./test/cases/${name}.ts`),
      {start_symbol: 'start'},
      ({r, t, k, nt, custom_terminal}) => {
        custom_terminal('id');
        custom_terminal('number');
        for(const rule of rules(t, k)){
          r.apply(void 0, rule);
        }
      }
    );

    const rules_filename = `./test/ref/${name}_rules.js`;
    const spec_filename  = `./test/ref/${name}_spec.js`;

    assert.equal(result.rules, read_text_file(rules_filename));
    assert.equal(result.spec , read_text_file(spec_filename));
  }

  it('One rule', () => {
    run('1', rules_1);
  });

  it('Calculator', () => {
    run('calculator', rules_calc);
  });
});

function read_text_file(path: string){
  return fs.readFileSync(path, {encoding: 'utf-8'});
}