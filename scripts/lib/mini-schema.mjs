// Minimal JSON Schema checker covering the keywords used by guidance/schema/*.json.
// Deterministic and dependency free. Returns a list of human-readable errors.
export function validate(schema, data, path = '$') {
  const errs = []
  const t = Array.isArray(data) ? 'array' : data === null ? 'null' : Number.isInteger(data) ? 'integer' : typeof data
  const types = schema.type ? [].concat(schema.type) : null
  if (types) {
    const ok = types.some(x => x === t || (x === 'number' && (t === 'integer' || t === 'number')) || (x === 'integer' && t === 'integer'))
    if (!ok) return [`${path}: expected ${types.join('|')}, got ${t}`]
  }
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(data)) errs.push(`${path}: must equal ${JSON.stringify(schema.const)}`)
  if (schema.enum && !schema.enum.some(v => JSON.stringify(v) === JSON.stringify(data))) errs.push(`${path}: must be one of ${schema.enum.join(', ')}`)
  if (typeof data === 'string') {
    if (schema.minLength && data.length < schema.minLength) errs.push(`${path}: shorter than ${schema.minLength}`)
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) errs.push(`${path}: "${data}" does not match ${schema.pattern}`)
  }
  if (typeof data === 'number' && schema.minimum !== undefined && data < schema.minimum) errs.push(`${path}: below ${schema.minimum}`)
  if (Array.isArray(data)) {
    if (schema.minItems && data.length < schema.minItems) errs.push(`${path}: needs at least ${schema.minItems} items (has ${data.length})`)
    if (schema.items) data.forEach((v, i) => errs.push(...validate(schema.items, v, `${path}[${i}]`)))
  }
  if (t === 'object') {
    for (const k of schema.required ?? []) if (!(k in data)) errs.push(`${path}: missing required "${k}"`)
    const props = schema.properties ?? {}
    for (const [k, v] of Object.entries(data)) {
      if (k in props) errs.push(...validate(props[k], v, `${path}.${k}`))
      else if (schema.additionalProperties === false) errs.push(`${path}: unexpected property "${k}"`)
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') errs.push(...validate(schema.additionalProperties, v, `${path}.${k}`))
    }
  }
  return errs
}
