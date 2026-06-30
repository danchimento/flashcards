import { getContentPack } from '../content/registry';
import { getQuestionType } from '../questions/registry';
import { createRng } from '../lib/rng';

// Build a full session up front from a config object. The result is a plain
// list of question instances the UI can step through.
export function buildSession(config, rng = createRng()) {
  const content = getContentPack(config.contentPackId);
  const typeIds = config.enabledTypeIds;
  if (typeIds.length === 0) throw new Error('No question types enabled');

  const questions = [];
  let prevTypeId = null;

  for (let i = 0; i < config.questionCount; i++) {
    // Mix it up: avoid repeating the same style back-to-back when possible.
    const pool = typeIds.length > 1 ? typeIds.filter((id) => id !== prevTypeId) : typeIds;
    const typeId = rng.pick(pool);
    const type = getQuestionType(typeId);
    questions.push({ typeId, data: type.generate({ content, rng }) });
    prevTypeId = typeId;
  }

  return { content, questions };
}
