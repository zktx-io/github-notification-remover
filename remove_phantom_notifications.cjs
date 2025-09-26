const { exec } = require("node:child_process");
const { basename } = require("node:path");

let _githubToken = null;
function getGithubToken() {
  if (_githubToken) return _githubToken;
  const t = process.env.GITHUB_TOKEN || process.env.INPUT_GITHUB_TOKEN;
  if (!t) throw new Error("GitHub token not found (set GITHUB_TOKEN or INPUT_GITHUB_TOKEN).");
  _githubToken = t;
  return _githubToken;
}

async function getNotifications(since) {
  const response = await fetch(`https://api.github.com/notifications?all=true&since=${since}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${getGithubToken()}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return response.json();
}

async function shouldIncludeNotificationForRemoval(notification) {
  try {
    const response = await fetch(`https://api.github.com/repos/${notification.repository.full_name}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${getGithubToken()}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return response.status === 404;
  } catch (error) {
    console.log("threw");
    if (error.code && error.code === 404) {
      return true;
    }
    console.error(error);
    throw error;
  }
}

async function markNotificationRead(notification) {
  const response = await fetch(notification.url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getGithubToken()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    console.error(
      `Failed to mark notification with thread URL ${notification.url} from repo ${notification.repository.full_name} as read: ${response.status} ${response.statusText}`
    );
  }
}

async function markNotificationDone(notification) {
  const response = await fetch(notification.url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getGithubToken()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    console.error(
      `Failed to mark notification with thread URL ${notification.url} from repo ${notification.repository.full_name} as done: ${response.status} ${response.statusText}`
    );
  }
}

async function unsubscribe(notification) {
  const response = await fetch(notification.subscription_url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getGithubToken()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    console.error(
      `Failed to unsubscribe from notification with thread URL ${notification.url} from repo ${notification.repository.full_name}: ${response.status} ${response.statusText}`
    );
  }
}

function daysAgoISO(n = 3) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

async function main() {
  // Minimal: CLI since > INPUT_SINCE > DAYS_BACK (default 3 days)
  const cliSince = process.argv[2];
  const envSince = process.env.INPUT_SINCE;
  const daysBack = Number(process.env.DAYS_BACK || 3);
  const rawSince = cliSince || envSince || daysAgoISO(daysBack);

  const d = new Date(rawSince);
  if (Number.isNaN(d.getTime())) {
    console.error(`${rawSince} is not a valid ISO 8601 date. Must be formatted as YYYY-MM-DDTHH:MM:SSZ.`);
    const bin = `${basename(process.argv[0])} ${basename(process.argv[1])}`;
    console.error(`Usage: ${bin} <since>  (or set env INPUT_SINCE / DAYS_BACK)`);
    process.exit(1);
  }
  const since = d.toISOString();

  const DRY_RUN = String(process.env.DRY_RUN || "true").toLowerCase() === "true";

  const notifications = await getNotifications(since);
  for (const notification of notifications) {
    if (await shouldIncludeNotificationForRemoval(notification)) {
      console.log(
        `Marking notification with thread URL ${notification.url} read from repo ${notification.repository.full_name}`
      );
      if (!DRY_RUN) await markNotificationRead(notification);

      console.log(
        `Marking notification with thread URL ${notification.url} done from repo ${notification.repository.full_name}`
      );
      if (!DRY_RUN) await markNotificationDone(notification);

      console.log(
        `Unsubscribing from notification with thread URL ${notification.url} from repo ${notification.repository.full_name}`
      );
      if (!DRY_RUN) await unsubscribe(notification);
    }
  }
  console.log("Done");
}

main().catch(console.error);