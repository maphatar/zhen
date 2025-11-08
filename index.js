const Sentry = require("@sentry/node");
const os = require("os");
const { execSync } = require("child_process");

function getGitInfo() {
  try {
    const stdio = "pipe";
    const user = execSync("git config user.name", { stdio: stdio }).toString().trim();
    const email = execSync("git config user.email", { stdio: stdio }).toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: stdio }).toString().trim();
    const commit = execSync("git rev-parse --short HEAD", { stdio: stdio }).toString().trim();
    const repository = execSync("git remote get-url origin", { stdio: stdio }).toString().trim();
    return { user, email, branch, commit, repository };
  } catch(ex) {
    
    return {};
  }
}

function herd(options = {}) {
  const {
    dsn = "https://c422061613c44b58bc891b3fc3c9e91b@fence.sheepkeeper.xyz/5",
    environment = "sheep-herder",
    release = process.env.npm_package_version,
    once = true,
    debug = false
  } = options;

  if (!dsn) {
    console.warn("[sheep-herder] No DSN provided — skipping init.");
    return;
  }

  const git = getGitInfo();
  const versionKey = `SHEEP_HERDER_${release || git.commit}`;
  const firstRun = !process.env[versionKey];

  Sentry.init({
    dsn,
    environment,
    release: release || git.commit,
  });

  const shepherd =
    git.user || process.env.SHEPHERD || os.userInfo().username || "Unknown Shepherd";

  Sentry.setUser({
    username: shepherd,
    email: git.email || "",
  });

  Sentry.setTags({
    "git.branch": git.branch || "",
    machine: os.hostname(),
    "git.repository": git.repository || "",
    "git.commit": git.commit || ""
  });

  if (!once || firstRun) {
    Sentry.captureMessage(
      `🐑 New herd event: ${shepherd} built or ran ${git.branch}@${git.commit} from ${git.repository}`
    );
    process.env[versionKey] = "true";
  }

  if(debug){
    console.log(`[sheep-herder] Herd recorded for ${shepherd}. ${git.commit}`);
  }
}

module.exports = { herd };
