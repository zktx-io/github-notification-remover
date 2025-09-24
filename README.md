# 🧹 GitHub Phantom Notifications Cleaner

This script helps you remove **phantom (ghost) GitHub notifications** — cases where your inbox shows unread notifications but nothing actually appears.
This often happens when repository access changes or due to GitHub UI quirks.

---

## ⚙️ Prerequisites

- Node.js (v18+ recommended)
- A GitHub Personal Access Token (PAT) with `notifications` scope
  (How to create one: [GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token))

---

## 🚀 Usage

1. **Set your token**
   In `remove_phantom_notifications.cjs`, update the `getGithubToken()` function:

   ```js
   function getGithubToken() {
     return "YOUR_GITHUB_TOKEN_HERE";
   }
   ```

2. **Run the script**

   ```bash
   node remove_phantom_notifications.cjs <since>
   ```

   - `<since>` = ISO8601 timestamp (only notifications created after this time will be cleaned up).
   - Example:

     ```bash
     node remove_phantom_notifications.cjs 2025-09-01T00:00:00Z
     ```

---

## 📌 Notes

- This will mark **all notifications after the given timestamp** as read, including phantom ones.
- Save or pin important notifications before running.
- The script uses the GitHub API and may be subject to rate limits.
- Built as a personal utility — use at your own discretion.
