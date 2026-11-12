// Loads a content YAML file, resolving `!include <path>` tags: each one is
// replaced by the parsed contents of that file, with the path taken relative to
// the file that contains the tag. Includes can nest; a cycle is an error.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadYaml(file, stack = []) {
  const abs = path.resolve(file);
  if (stack.includes(abs)) {
    throw new Error(`circular !include: ${[...stack, abs].join(' -> ')}`);
  }
  const include = new yaml.Type('!include', {
    kind: 'scalar',
    construct: (rel) => loadYaml(path.resolve(path.dirname(abs), rel), [...stack, abs]),
  });
  const schema = yaml.DEFAULT_SCHEMA.extend([include]);
  return yaml.load(fs.readFileSync(abs, 'utf8'), { schema, filename: abs });
}

module.exports = { loadYaml };
