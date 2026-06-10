export interface TutorialPublication {
  published?: boolean;
  hidden?: boolean;
}

export function isTutorialPublished(tutorial: TutorialPublication): boolean {
  return tutorial.published !== false;
}

export function isTutorialListed(tutorial: TutorialPublication): boolean {
  return isTutorialPublished(tutorial) && tutorial.hidden !== true;
}
