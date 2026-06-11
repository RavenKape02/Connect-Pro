# ConnectPro Academy

**Built by John Raven Caduyac.** A Google Apps Script Web App backed by a Google Sheet, for managing clients, VAs, assignments, and hours.

An internal web app for the operations team at ConnectPro Academy. It keeps
track of clients, virtual assistants, assignments, and hours worked. It
replaces the spreadsheets and chat messages the team was using before.

The main reason it exists: the operations manager used to spend hours every
end of month adding up timesheets by hand. This app does it in one click.

---

## 1. How to use

Open the web app link in any browser. The page has a sidebar on the left.
Click a section to go to it.

### Monthly Report
The most important screen. Pick a year and a month, click **Generate Report**.
The table shows every VA who had an active assignment that month, how many
hours they worked, what was agreed, and the difference.

For **Regular** assignments, it compares hours worked this month to the
agreed hours per month. For **Project** assignments, it compares total hours
worked to date to the agreed total hours for the whole project.

### Create Assignment
Pick a VA, a client, the type (Regular or Project), a start date, and how
many hours are agreed. The form hides or shows the End Date field depending
on the type you pick.

- **Regular** means ongoing work, with a set number of hours per month.
- **Project** means a fixed piece of work with a start date, an end date,
  and a total number of hours.

### Log Hours
Pick the assignment, the date, how many hours were worked, and what was
done. Click **Log Hours**. The form rejects hours that are out of range
or outside the assignment's time window.

### Match VAs
Pick a client. The app shows all active VAs that have skills the client
needs, ranked by how much of the client's needs they can cover. The list
also shows how many assignments each VA is already on.

### Assignments
A list of all assignments with their type, dates, and status. Click
**Complete** to mark an assignment as done. Completed assignments no
longer accept new hours.

### Clients and VAs
Lists of all clients and VAs in the system, with a form to add new ones
at the top.

---

## 2. Data model

The database is one Google Sheet with seven sheets.

```
Skills ──┬── VA_Skills ────── VAs ───┐
         │                           ├── Assignments ── Hours_Log
         └── Client_Needs ── Clients ┘
```

- **Clients** - the businesses that ask for VA help
- **VAs** - the virtual assistants
- **Skills** - the list of skills (e.g. "Bookkeeping", "Social Media Marketing")
- **VA_Skills** - which skills each VA has (many VAs to many skills)
- **Client_Needs** - which skills each client needs (many clients to many skills)
- **Assignments** - links a VA to a client, with a type (Regular or Project)
- **Hours_Log** - one row per day a VA worked on an assignment

`VA_Skills` and `Client_Needs` are the link tables. They let one VA have
many skills and one skill belong to many VAs, without putting a list
inside a single cell.

The two junction tables are also how matching works. A VA matches a client
when they have skills the client needs.

---

## 3. Business rules the app checks

When you create an assignment, the app makes sure:

- The VA exists and is Active.
- The type is Regular or Project.
- If Regular: has an `AgreedHoursPerMonth`, has no end date.
- If Project: has an `AgreedTotalHours`, has an end date, and the end date
  is after the start date.
- A VA cannot have two active assignments with the same client at the
  same time.

When you log hours, the app makes sure:

- The hours are between 0 and 24.
- The date is on or after the assignment's start date.
- For Project assignments, the date is on or before the end date.
- The assignment is still active.

---

## 4. How the report works

The report picks every assignment that was active in the chosen month:

- Status is Active.
- Started on or before the last day of the month.
- For Regular: no end date to check.
- For Project: the end date is on or after the first day of the month.

For each one, it adds up the hours logged in that month (and the total
hours for Project assignments).

Then it computes the difference:

- **Regular**: `worked this month` minus `agreed hours per month`.
- **Project**: `total worked to date` minus `agreed total hours`.

A red number means the VA worked less than agreed. A green number means
they worked more. The summary at the top of the report adds everything up
for a quick at-a-glance check.

---

## 5. How it's built

The app is a Google Apps Script Web App. The Google Sheet is the database.

The code is split into a few small files:

- `Code.gs` - the entry point. Serves the HTML page.
- `DataService.gs` - reads and writes to the sheets. All other files go
  through this one.
- `Assignments.gs` - the rules for creating and updating assignments.
- `Hours.gs` - the rules for logging hours.
- `Report.gs` - the monthly report logic.
- `Match.gs` - the matchmaking logic.
- `Index.html` - the web page itself. Has the sidebar, forms, and
  tables. Talks to the server files using `google.script.run`.

---

## 6. Code decisions

A few choices I made and why:

**Two link tables for skills (`VA_Skills` and `Client_Needs`)** instead of
putting skills inside the VA or Client rows. This is the standard way to
do many-to-many in a relational setup. It lets us add or remove a skill
from a VA without rewriting the VA row, and it lets one skill belong to
many VAs.

**Explicit `Status` field on assignments** (Active or Completed) instead
of guessing from the dates. This keeps the business rules simple and lets
the operations team mark a project as done even if it ended early. It also
lets the team reactivate an assignment by flipping the status back.

**One validation file per concern.** `Assignments.gs` checks assignment
rules, `Hours.gs` checks hours rules. Easy to find, easy to change.

**All reads go through `getAll` in `DataService.gs`.** If a sheet name
is wrong, the error message points to the exact sheet. If we ever need
to add caching or change how dates are read, we change one place.

**Single HTML file with clear `<style>` and `<script>` blocks.** Apps
Script can split HTML into multiple files using an `include()` helper, but
for a tool this size, one file is easier to read and deploy.

**Sample data is included.** 5 clients, 6 VAs, 12 skills, 6 assignments
(mix of Regular and Project), and around 30 hours of entries. The data
is set up so the May 2025 report has interesting numbers across all
assignment types.

---

## 7. Assumptions

Things I assumed that were not in the brief:

- One VA can have a Regular assignment and a Project assignment with the
  same client at the same time (different scopes of work). I block two
  assignments of the same type with the same client.
- Hours are entered by the operations team, not the VAs themselves.
  There is no login in this version.
- The "Active" status of a VA is set by editing the VAs sheet directly.
  The app reads it but does not change it.
- The agreed hours number is decided when the assignment is created. It
  can be edited in the sheet, but not in the app.
- For a Project assignment, the comparison in the monthly report is to
  the total hours agreed for the whole project, not a monthly cap. The
  monthly hours column in the report is informational only for projects.

---

## 8. How to set it up from scratch

To run it on a fresh Google Sheet:

1. Create a new Google Sheet.
2. For each CSV in the `data/` folder: **File > Import > Upload > Insert
   new sheet(s)**. You should end up with seven sheets: `Clients`, `VAs`,
   `Skills`, `VA_Skills`, `Client_Needs`, `Assignments`, `Hours_Log`.
3. In the Sheet, open **Extensions > Apps Script**.
4. Create a new file for each `.gs` and `Index.html` in the `apps-script/`
   folder, and paste in the contents.
5. **Deploy > New deployment > Web app**. Execute as "Me", access
   "Anyone with the link".
6. Open the URL.

---

## 9. What I would add next

If I had more time, I would add:

- A login screen and per-user roles, so VAs can log their own hours.
- Edit and delete on assignments and hours (right now the only edits are
  completing an assignment).
- Charts in the monthly report (a bar chart of worked vs agreed per VA).
- A warning on the report when a Project is close to its hours cap
  (e.g. 80% used).
- An "import from CSV" button in the app, so the operations team does
  not have to touch the sheet to load data.
