import { questionTypeList } from './questions/registry';

// One place to tweak defaults while we iterate on the game.
export const defaultConfig = {
  contentPackId: 'us-states',
  questionCount: 10,
  // which question styles are in play; defaults to all registered types
  enabledTypeIds: questionTypeList.map((t) => t.id),
};

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];
