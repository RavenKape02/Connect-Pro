/**
 * Hours - log daily hours against an assignment.
 *
 * Rules:
 *   - HoursWorked between 0 and 24.
 *   - Date must be on/after assignment StartDate.
 *   - For Project assignments, Date must be on/before EndDate.
 *   - Assignment must be Active.
 */

function logHours(p) {
  const assignmentId = Number(p.assignmentId);
  const d = toDate(p.date);
  const hours = Number(p.hoursWorked);

  if (!assignmentId) throw new Error('Assignment is required.');
  if (!d) throw new Error('Date is required.');
  if (!(hours > 0) || hours > 24) throw new Error('Hours must be between 0 and 24.');

  const a = getAll(SHEETS.ASSIGNMENTS).find(x => Number(x.AssignmentID) === assignmentId);
  if (!a) throw new Error('Assignment not found.');
  if (a.Status !== 'Active') throw new Error('Cannot log hours on a non-active assignment.');

  const start = toDate(a.StartDate);
  if (start && d < start) throw new Error('Date is before assignment start.');

  if (a.AssignmentType === 'Project') {
    const end = toDate(a.EndDate);
    if (end && d > end) throw new Error('Date is after project end date.');
  }

  const id = nextId(SHEETS.HOURS_LOG, 'LogID');
  append(SHEETS.HOURS_LOG, [id, assignmentId, d, hours, p.description || '']);
  return id;
}
