import { SkillPill } from '../types';

const genericCover = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800';

/** Always return a usable cover for catalog and learning views, even for older API rows. */
export function getSkillCover(skill?: Pick<SkillPill, 'id' | 'coverUrl'> | null): string {
  if (!skill) return genericCover;
  return skill.coverUrl || genericCover;
}
