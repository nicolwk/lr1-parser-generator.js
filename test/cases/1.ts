import { RuleOptions } from "../../src/rule";

export default (t: (token: string) => object, k: (token: string) => object): [string, any[], ((...args: any[]) => any)?, RuleOptions?][] => [
  ['start', ['id']]
]