export function defaultItemForArrayType(type: string): any {
  switch (type) {
    case 'string': return ''
    case 'string[]': return ''
    case 'number': return 0
    case 'number[]': return 0
    case 'boolean': return false
    case 'boolean[]': return false
    case 'object': return '{}'
    case 'object[]': return '{}'
    default: return null
  }
}
