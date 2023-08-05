import { RuleOptions } from "../../src/rule";

export default (t: (token: string) => object, k: (token: string) => object): [string, any[], ((...args: any[]) => any)?, RuleOptions?][] => [
  ['start', ['expr']],
  ['expr', ['expr', t('+'), 'expr_1']],
  ['expr', ['expr', t('-'), 'expr_1']],
  ['expr', ['expr_1']],
  ['expr_1', ['expr_1', t('*'), 'expr_2']],
  ['expr_1', ['expr_1', t('/'), 'expr_2']],
  ['expr_1', ['expr_2']],
  ['expr_2', ['number']],
  ['expr_2', [t('('), 'expr', t(')')]]
]