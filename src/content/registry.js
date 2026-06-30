import { usStates } from './usStates';

// Register content packs here. Adding geography content = add a pack + one line.
const packs = [usStates];

export const contentPacks = Object.fromEntries(packs.map((p) => [p.id, p]));

export function getContentPack(id) {
  const pack = contentPacks[id];
  if (!pack) throw new Error(`Unknown content pack: ${id}`);
  return pack;
}
