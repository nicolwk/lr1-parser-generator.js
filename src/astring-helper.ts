export function literal(value: number|string|boolean){
  return {type: 'Literal', value};
}

export function array(elements: any[]){
  return {type: 'ArrayExpression', elements};
}

export function property(name: string, value: any){
  return {
    type: "Property",
    key: {
      type: "Identifier",
      name
    },
    computed: false,
    value,
    kind: "init",
    method: false,
    shorthand: false
  };
}