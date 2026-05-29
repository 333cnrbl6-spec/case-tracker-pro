/**
 * CaseNarrative Data Policy
 * 
 * The developer account (william.mark.bradley@gmail.com) has full visibility
 * of all data across the platform — build data, demo cases, test records.
 * 
 * All other users (beta testers, future customers) only see data they created,
 * keeping the platform clean and uncontaminated by build/dev artefacts.
 */

export const DEVELOPER_EMAIL = 'william.mark.bradley@gmail.com';

/**
 * Returns true if the given user is the developer/owner account.
 */
export function isDeveloper(user) {
  return user?.email === DEVELOPER_EMAIL;
}

/**
 * Returns a filter object for entity queries.
 * Developer: no filter (sees all data).
 * Other users: filter to only their own records.
 * 
 * Usage:
 *   const filter = getDataFilter(user);
 *   const cases = await base44.entities.LegalCase.filter(filter);
 */
export function getDataFilter(user) {
  if (!user) return { created_by: '__none__' }; // unauthenticated — return nothing
  if (isDeveloper(user)) return {};              // developer sees everything
  return { created_by: user.email };             // beta testers see only their own
}