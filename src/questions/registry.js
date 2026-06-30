import { identifyState } from './identifyState';
import { locateState } from './locateState';

// Register question types here. Adding a new style = add a plugin + one line.
// Each plugin: { id, label, generate({ content, rng }), Component }
const types = [identifyState, locateState];

export const questionTypes = Object.fromEntries(types.map((t) => [t.id, t]));
export const questionTypeList = types;

export function getQuestionType(id) {
  const type = questionTypes[id];
  if (!type) throw new Error(`Unknown question type: ${id}`);
  return type;
}
