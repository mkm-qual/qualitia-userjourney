const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = process.env.DB_DIR ? path.join(process.env.DB_DIR, 'data') : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JOURNEY_FILE = path.join(DATA_DIR, 'journey.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Users
function getUsers() { return readJSON(USERS_FILE) || []; }
function saveUsers(users) { writeJSON(USERS_FILE, users); }

function findUser(username) { return getUsers().find(u => u.username === username) || null; }
function findUserById(id) { return getUsers().find(u => u.id === id) || null; }

function createUser(username, password, role = 'user') {
  const users = getUsers();
  if (users.find(u => u.username === username)) throw new Error('Username already exists');
  const user = { id: uuidv4(), username, password_hash: bcrypt.hashSync(password, 10), role, created_at: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  return user;
}

function updateUserPassword(id, password) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found');
  users[idx].password_hash = bcrypt.hashSync(password, 10);
  saveUsers(users);
}

function deleteUserById(id) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  if (!user) throw new Error('User not found');
  if (user.username === 'admin') throw new Error('Cannot delete the admin account');
  saveUsers(users.filter(u => u.id !== id));
}

// Journey
function getJourney() { return readJSON(JOURNEY_FILE); }
function saveJourney(data, updatedBy) {
  const now = new Date().toISOString();
  data.lastUpdated = now;
  data.updatedBy = updatedBy;
  writeJSON(JOURNEY_FILE, { data, updated_at: now, updated_by: updatedBy });
}
function getJourneyMeta() {
  const j = readJSON(JOURNEY_FILE);
  if (!j) return null;
  return { updated_at: j.updated_at, updated_by: j.updated_by };
}

const INITIAL_DATA = {
  rowHeaders: [
    { id: 'userSteps', label: 'User Steps', color: '#3B82F6', description: 'What is each step of the user journey' },
    { id: 'userActions', label: 'User Actions', color: '#8B5CF6', description: 'What action does the user take during each step?' },
    { id: 'feelingsThoughts', label: 'Feelings & Thoughts', color: '#EC4899', description: 'How is the user feeling during each step?' },
    { id: 'painPoints', label: 'Pain Points', color: '#EF4444', description: "What's not working well? What causes friction?" },
    { id: 'aiOpportunities', label: 'AI Opportunities (BELLA)', color: '#10B981', description: 'How will we create opportunities for BELLA?' },
    { id: 'kpi', label: 'KPI', color: '#F59E0B', description: 'Key Performance Indicators for this phase' }
  ],
  phases: [
    {
      id: uuidv4(), name: 'Onboarding / Setup', order: 0,
      cells: {
        userSteps: 'Email link to download the server\nDownload Qualitia\nClick on downloaded file (json + exe)\nAgree license agreement\nClick Next → Configure settings\nClick Install → Installing\nClick Finish\nQualitia login screen opens',
        userActions: 'Download Qualitia (2 files: json and exe)\nClick Settings icon on Left panel → Settings pop-up opens\nSelect: Only for me (Local app data) OR All Users (Multiple profiles)\nConfigure: Server configuration, Project configuration\nClick Next → Open and Read Agreement → Check checkbox → Click Save\nLogin screen → Click Login → Enter username and password\nLogin Using SSO',
        feelingsThoughts: '😫 "It feels I have reached dead end before I Start"\n😕 Confusion on Selection — All users or Only Me?\n😤 No real help!\n😩 Boring & Tedious\n🙁 Downloaded 2.5 GB with no guidance',
        painPoints: '🔴 2.5 GB download with no internet fallback — First Friction Point\n🔴 Qualitia File and server file must be in same folder; moving one breaks the setup\n🟡 Setup Icon looks like Download Icon — misleading\n🟡 No link between setup wizard and Test Cases\n🟡 Incorrect slash in server URL causes silent failure\n🟡 https is required at Enter URL — not validated\n🟡 Wrong interpretation of the Menu location',
        aiOpportunities: '💡 User submits a document → Bella creates a project with team\n💡 Help user in onboarding flow — Can we onboard via Bella?\n💡 Launch Button could be added to guide first-time setup\n💡 Tell users what pre-requisites are required before starting'
      }
    },
    {
      id: uuidv4(), name: 'Create a new Project, Team', order: 1,
      cells: {
        userSteps: 'Project management Menu\nClick Add project\nCreate Project\nProject type Pop-up\nCreate project Pop-up\nAdmin adds users\nUser & Role Management\nCreate Role & assign privileges',
        userActions: 'Click Create New Project → Add project icon\nIn pop-up: Fill Project Name, Description, Project type\nCreate project\nAdmin: Add client → User and Role Management → Create Role → fill information → Assign privileges\nClick add user icon → In pop-up: select user, assign Role → Users Assigned',
        feelingsThoughts: '😕 Confusion with Project Type names (Desktop app, web/mob app, salesforce project)\n🤔 Only 3 options under Project Type\n😐 Project Type selection may not be needed in future\n😤 UI alignment issues on Welcome Page',
        painPoints: '🟡 Wrong interpretation of the Project Management Menu location\n🟡 Unclear User Installation Location\n🔴 Not able to handle 50 users concurrently\n🔴 IT Compliance is a bottleneck for enterprise deployment\n🟡 Need Prompt Integration with Jira / Notion\n🟡 GIT Integration is a challenge\n🟡 Whitelist Qualitia, Artefacts + Laptop needed by IT',
        aiOpportunities: '💡 Ask Bella to duplicate a project and add to team\n💡 Give description and ask Bella to suggest scenarios\n💡 Bella suggests project hierarchy (maybe an infographic)\n💡 Ask to duplicate a project and add to team with context'
      }
    },
    {
      id: uuidv4(), name: 'Prepare for Test / Planning', order: 2,
      cells: {
        userSteps: 'Create Scenario\nCreate new Test Case (TC) and Task\nAssign tasks to team members\nPlan test coverage',
        userActions: 'Click Create Test Cases CTA (Scenario added on left panel)\nClick Create CTA → Name, Description, Manual TC ID\nDiscard/Save CTA, Checkbox "Create another TC"\nEmpty tc / Generate using AI\nClick Add TC → Add object, Action, Step, Parameter\nClick Add Task tool → Select Newly added Row\nClick Create Task → Task options',
        feelingsThoughts: '🤔 Inside Test Case Editor — Why is there a Create Scenario Button here?\n😕 Confusion: Debugger could be automated?\n🔄 Scenario Name options pop-up is unclear\n😐 No separation of system complexity vs avoidable complexity',
        painPoints: '🔴 Autosave Test Case is not possible due to technical limitation\n🟡 TC/Step & Task creation flow needs clarity\n🟡 Column name "Type of Errors" needs to be renamed\n🟡 Reload Project is hidden inside Settings (unexpected)\n🟡 Zoom Level — no project hierarchy visual',
        aiOpportunities: '💡 Create Testcase → start recorder → Bella plans the testcase like a workflow\n💡 Create scenario → ask Bella to suggest testcases automatically\n💡 Ask Bella to suggest tasks for a testcase\n💡 Generate using AI for entire test case creation from description'
      }
    },
    {
      id: uuidv4(), name: 'Test / Execute', order: 3,
      cells: {
        userSteps: 'Web Recorder and Execute\nSelect browser\nRecord steps on live product\nExecute test cases\nView and save results',
        userActions: 'Click on execute tool → Opens browser and runs\nExecute selected test cases after saving\nSelect browser → Opens Chrome\nClick on Start Recorder → Interact online → steps captured automatically\nClick stop on browser → Qualitia automatically saves TC execution steps\nAdd URL → Click on Start Debugger tool\nOpen Qualitia → click on save TC',
        feelingsThoughts: "😕 Don't know how to get started with a new project\n😤 While using Recorder on Chrome — there is no validation on clicking objects\n😩 Pop-up for loading is confusing and blocks the workflow\n🤔 Only 3 options under Project Type — seems limiting",
        painPoints: '🟡 After Execution report gets generated automatically — location is unclear\n🟡 Error Toolkit Icon & the Naming is confusing\n🔴 Sometimes No Idea of Prerequisite on every start\n🟡 Scroll/Selection not available after step creation\n🟡 Zoom Level — What is the project hierarchy? Needs an infographic',
        aiOpportunities: '💡 Initiate recorder with URL — Bella starts recorder for you\n💡 Create custom actions via Bella\n💡 Import Objects automatically\n💡 Bella helps user with the testcase, more like a workflow / plan the testcase\n💡 Ask Bella to suggest tasks for a testcase based on URL'
      }
    },
    {
      id: uuidv4(), name: 'Debug', order: 4,
      cells: {
        userSteps: 'Click on Start Debugger tool\nStep through execution\nIdentify failures\nFix issues and re-run',
        userActions: 'Click on Start Debugger tool\nStep through test case execution step by step\nIdentify and address failures\nClick on Start Debugger tool again after fixes',
        feelingsThoughts: '😩 "I have reached a dead end before I Start"\n😕 No idea how to interpret debugger output\n🤔 Confusion: Could this be automated?\n😤 Initial loading time on every start is frustrating',
        painPoints: '🔴 Autosave not possible due to technical limitation — e.g., license server: IT installs for a user then adds another user who takes over. Its a hassle.\n🟡 Scroll/Selection issues in debugger view\n🟡 IT compliance is a bottleneck for installation\n🔴 Error: Toolkit Icon & the Naming needs to change',
        aiOpportunities: '💡 Describe a condition loop → Bella creates it with different data points, generates larger report, asks to merge in testcase\n💡 Debug testcase / healing suggestions from Bella\n💡 Bring up different part of the product — show errors in current testcase\n💡 Search task errors automatically\n💡 Initiate debugging, ask Bella to execute certain steps with testcase'
      }
    },
    {
      id: uuidv4(), name: 'Reports & Efficiency', order: 5,
      cells: {
        userSteps: 'After Execution report gets generated automatically in Qualitia\nView reports\nShare reports with team\nMonitor efficiency metrics',
        userActions: 'Open generated report in Qualitia after execution\nReview test results and coverage\nShare report with stakeholders\nSchedule automated reports\nReload Project if needed',
        feelingsThoughts: '🙂 Reports generated automatically is a helpful feature\n🤔 Initial loading time on every start could be improved\n😊 What are the next steps after viewing a report?\n😐 Human Interaction (Sales, IT) is still required for many things',
        painPoints: '🟡 GIT Integration is a challenge for report storage\n🟡 Human Interaction — Sales, IT coordination still needed\n🟡 Clarity on Settings is poor\n🟡 Naming confusion in report sections\n🟡 No confirmation screen after successful installation\n🔴 Zephyr / TestRail / XL Sheet Import at creation not supported',
        aiOpportunities: '💡 Describe execution profile → Bella suggests config to create one\n💡 Initiate debugging, ask Bella to execute certain steps with testcase\n💡 Schedule reports with Bella — automated delivery\n💡 Bella analyzes report and suggests improvements for next sprint\n💡 Zephyr / TestRail / XL Sheet Import at creation via Bella'
      }
    }
  ],
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

function initDB() {
  ensureDataDir();

  if (!fs.existsSync(USERS_FILE)) {
    const adminHash = bcrypt.hashSync('Admin@123', 10);
    saveUsers([{ id: uuidv4(), username: 'admin', password_hash: adminHash, role: 'admin', created_at: new Date().toISOString() }]);
    console.log('Admin user created — login: admin / Admin@123');
  }

  if (!fs.existsSync(JOURNEY_FILE)) {
    saveJourney(INITIAL_DATA, 'system');
    console.log('Initial journey data seeded');
  }

  console.log('Data directory:', DATA_DIR);
}

module.exports = {
  initDB, getUsers, saveUsers, findUser, findUserById,
  createUser, updateUserPassword, deleteUserById,
  getJourney, saveJourney, getJourneyMeta
};
