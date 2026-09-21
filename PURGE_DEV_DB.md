# Removing prisma/dev.db from git history

The file is already untracked and ignored, so **new** commits are clean. But it
still sits in commit `c7ca1c7` ("Initial commit"), so anyone who clones the repo
can still read it. It holds one user's email and a Google OAuth access token.

**The token expired on 2026-09-01**, so it can no longer be used. The email and
the album ids are still in there, and a leaked credential should be revoked on
principle even once expired.

This rewrites history, so every collaborator must re-clone or hard-reset
afterwards. Do it when nobody else is mid-branch.

## 1. Revoke the Google grant first

At https://myaccount.google.com/permissions, remove this app's access for the
account in that database. Do this before the rewrite: it is the part that
actually matters, and it does not depend on the history being clean.

## 2. Back up

    git clone --mirror https://github.com/synchronousbuilddigital/Memorylane.git ~/memorylane-backup.git

## 3. Purge the file from every commit

    brew install git-filter-repo
    cd /Users/vaasu/Documents/MY_PROJECT/Memory_lane
    git filter-repo --path prisma/dev.db --invert-paths --force

`git filter-repo` drops the remote as a safety measure, so add it back:

    git remote add origin https://github.com/synchronousbuilddigital/Memorylane.git

## 4. Verify it is gone, then push

    git log --all --oneline -- prisma/dev.db     # must print nothing

    git push origin --force --all
    git push origin --force --tags

## 5. Tell collaborators

Every existing clone still has the old history. They must re-clone, or:

    git fetch origin && git reset --hard origin/main

## 6. Ask GitHub to drop cached views

Old commits stay reachable through the web UI for a while. Open a support
request at https://support.github.com/ asking them to garbage-collect the
repository, citing the removed blob.

---

A copy of the database was saved outside the repo before untracking, in this
session's scratchpad, in case you still need the rows:
`dev.db.backup`

---

# Admin access (changed 2026-09-21)

Admins are no longer listed in `ADMIN_EMAILS`. The role lives on the user row,
so it can be granted and revoked from `/admin/users` without a redeploy.

**Deployment note:** remove `ADMIN_EMAILS` from the hosting provider's
environment settings. It is no longer read, so leaving it there is harmless but
misleading.

**Make the first admin on a new environment** (they must sign in once first, so
the account exists):

    npm run grant-admin you@example.com

**Other commands:**

    npm run grant-admin them@example.com --revoke
    npm run grant-admin --list

**If everyone loses access**, run the grant command again. The app refuses to
demote the last admin, in the panel and in the script, so this should not happen.
