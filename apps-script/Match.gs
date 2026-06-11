/**
 * Match - rank Active VAs by how many of a client's required skills they have.
 */

function findMatchingVAs(clientId) {
  clientId = Number(clientId);
  if (!clientId) throw new Error('Client is required.');

  const needs = getAll(SHEETS.CLIENT_NEEDS)
    .filter(n => Number(n.ClientID) === clientId)
    .map(n => Number(n.SkillID));
  if (needs.length === 0) return [];

  const skills = getAll(SHEETS.SKILLS);
  const vaSkills = getAll(SHEETS.VA_SKILLS);
  const vas = getAll(SHEETS.VAS);
  const activeAssignments = getAll(SHEETS.ASSIGNMENTS).filter(a => a.Status === 'Active');

  return vas
    .filter(v => v.Status === 'Active')
    .map(v => {
      const mine = vaSkills.filter(s => Number(s.VAID) === Number(v.VAID)).map(s => Number(s.SkillID));
      const matched = mine.filter(s => needs.includes(s));
      const activeCount = activeAssignments.filter(a => Number(a.VAID) === Number(v.VAID)).length;
      return {
        VAID: v.VAID,
        VAName: v.VAName,
        MatchedSkills: matched.map(sid => {
          const s = skills.find(x => Number(x.SkillID) === sid);
          return s ? s.SkillName : sid;
        }),
        MatchedCount: matched.length,
        RequiredCount: needs.length,
        ActiveAssignments: activeCount
      };
    })
    .filter(v => v.MatchedCount > 0)
    .sort((a, b) => b.MatchedCount - a.MatchedCount);
}
