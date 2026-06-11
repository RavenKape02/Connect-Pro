/**
 * Report - generate the monthly hours report.
 *
 * For each assignment active in the chosen month:
 *   - Regular: compare hours worked this month to AgreedHoursPerMonth.
 *   - Project: compare hours worked to date to AgreedTotalHours.
 *
 * Returns: { month, year, rows: [...] }
 */

function getMonthlyReport(p) {
  const year = Number(p.year);
  const month = Number(p.month);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Provide a valid year and month (1-12).');
  }

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // last day of month

  const assignments = getAll(SHEETS.ASSIGNMENTS);
  const clients = getAll(SHEETS.CLIENTS);
  const vas = getAll(SHEETS.VAS);
  const logs = getAll(SHEETS.HOURS_LOG);

  const rows = [];

  assignments.forEach(a => {
    const start = toDate(a.StartDate);
    const end = a.EndDate ? toDate(a.EndDate) : null;
    if (!start) return;

    const activeThisMonth =
      a.Status === 'Active' &&
      start <= monthEnd &&
      (a.AssignmentType === 'Regular' || (end && end >= monthStart));
    if (!activeThisMonth) return;

    const allAssignmentLogs = logs.filter(l => Number(l.AssignmentID) === Number(a.AssignmentID));
    const monthHours = allAssignmentLogs
      .filter(l => {
        const d = toDate(l.Date);
        return d && d >= monthStart && d <= monthEnd;
      })
      .reduce((s, l) => s + (Number(l.HoursWorked) || 0), 0);

    const totalHours = allAssignmentLogs
      .reduce((s, l) => s + (Number(l.HoursWorked) || 0), 0);

    const va = vas.find(v => Number(v.VAID) === Number(a.VAID));
    const client = clients.find(c => Number(c.ClientID) === Number(a.ClientID));

    const agreed = a.AssignmentType === 'Regular'
      ? Number(a.AgreedHoursPerMonth) || 0
      : Number(a.AgreedTotalHours) || 0;

    const compared = a.AssignmentType === 'Regular' ? monthHours : totalHours;
    const diff = compared - agreed;

    rows.push({
      AssignmentID: a.AssignmentID,
      VA: va ? va.VAName : '?',
      Client: client ? client.ClientName : '?',
      Type: a.AssignmentType,
      Agreed: agreed,
      WorkedThisMonth: monthHours,
      WorkedToDate: totalHours,
      Compared: compared,
      Difference: diff,
      Status: a.Status,
      EndDate: a.EndDate || ''
    });
  });

  return {
    month: monthStart.toLocaleString('en-US', { month: 'long' }),
    year: year,
    rows: rows
  };
}
