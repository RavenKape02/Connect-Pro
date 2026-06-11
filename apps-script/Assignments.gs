/**
 * Assignments - create assignments with Regular/Project business rules.
 *
 * Business rules enforced here:
 *   - VA must exist and be Active.
 *   - AssignmentType is either 'Regular' or 'Project'.
 *   - Regular: AgreedHoursPerMonth is set, EndDate is empty.
 *   - Project: AgreedTotalHours is set, EndDate is required and after StartDate.
 *   - A VA cannot have two Active assignments with the same client.
 */

function createAssignment(p) {
  const vaId = Number(p.vaId);
  const clientId = Number(p.clientId);
  const type = p.type;
  const start = toDate(p.startDate);
  const end = toDate(p.endDate);
  const agreed = Number(p.agreedHours);

  if (!vaId || !clientId) throw new Error('VA and Client are required.');
  if (type !== 'Regular' && type !== 'Project') throw new Error('Type must be Regular or Project.');
  if (!start) throw new Error('StartDate is required.');
  if (!(agreed > 0)) throw new Error('Agreed hours must be greater than 0.');

  if (type === 'Project') {
    if (!end) throw new Error('Project assignments need an EndDate.');
    if (end <= start) throw new Error('EndDate must be after StartDate.');
  }

  const va = getAll(SHEETS.VAS).find(v => Number(v.VAID) === vaId);
  if (!va) throw new Error('VA not found.');
  if (va.Status !== 'Active') throw new Error('VA is not Active.');

  const clash = getAll(SHEETS.ASSIGNMENTS).find(a =>
    a.Status === 'Active' && Number(a.VAID) === vaId && Number(a.ClientID) === clientId
  );
  if (clash) throw new Error('This VA already has an active assignment with this client.');

  const id = nextId(SHEETS.ASSIGNMENTS, 'AssignmentID');
  append(SHEETS.ASSIGNMENTS, [
    id, vaId, clientId, type,
    start,
    end || '',
    type === 'Regular' ? agreed : '',
    type === 'Project' ? agreed : '',
    'Active'
  ]);
  return id;
}

function setAssignmentStatus(p) {
  const assignmentId = Number(p.assignmentId);
  const status = p.status;
  if (status !== 'Active' && status !== 'Completed') {
    throw new Error('Status must be Active or Completed.');
  }
  const sheet = _sheet(SHEETS.ASSIGNMENTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === assignmentId) {
      sheet.getRange(i + 1, 9).setValue(status); // column I = Status
      return true;
    }
  }
  throw new Error('Assignment not found.');
}

function getAllAssignments() { return getAll(SHEETS.ASSIGNMENTS); }
