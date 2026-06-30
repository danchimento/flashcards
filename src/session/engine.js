import { getQuestionType } from '../questions/registry';

// Build a single question for a specific target item, choosing one of the
// enabled question styles. `avoidTypeId` lets the caller reduce immediate
// repeats of the same style for variety.
export function generateQuestion({ content, enabledTypeIds, target, rng, avoidTypeId }) {
  const pool =
    enabledTypeIds.length > 1 ? enabledTypeIds.filter((id) => id !== avoidTypeId) : enabledTypeIds;
  const typeId = rng.pick(pool.length ? pool : enabledTypeIds);
  const type = getQuestionType(typeId);
  return { typeId, data: type.generate({ content, rng, target }) };
}
