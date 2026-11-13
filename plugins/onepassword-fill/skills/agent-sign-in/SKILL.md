---
name: agent-sign-in
description: Sign in to a site (TaxAct, QuickBooks/Intuit, and other saved logins) through a Browser Automation session with a username, password, or one-time code from the user's 1Password Agents vault, without seeing the values. Use when a site asks you to sign in or for a verification code, or when a sign-in expired.
---

Never ask the user for a password, a one-time code, or a 1Password token, and
never type one into a page or a script yourself. Use the fill instead:

1. Open a Browser Automation session and navigate the named page (default
   `main`) to the site's sign-in form. Take a snapshot to find the fields.
2. Fill each field by CSS selector. The login is the vault item's exact title.

   ```sh
   bb 1password fill --session <session-id> --item "TaxAct" --field username --selector '#username'
   bb 1password fill --session <session-id> --item "TaxAct" --field password --selector '#password'
   ```

   The `onepassword_fill` agent tool takes the same inputs.
3. Click the sign-in button. When the site asks for a verification code from an
   authenticator app, fill `--field otp` into the code input. The code is
   generated at fill time, so fill it right before submitting.

A fill prints only `ok` or an error code with a hint. Act on the code:

- `item_not_found`, `field_missing`: ask the user to add the login (with the
  site's sign-in URL saved on it) or its one-time password to the Agents vault.
  Do not ask for the value itself.
- `origin_mismatch`: the page is not on a website saved on that login. Check
  the address bar; never retry on another site.
- `fills_disabled`, `token_missing`: setup isn't finished; tell the user.
- `element_not_found`, `navigated`: take a new snapshot and retry with a
  correct selector.

If a site sends the code by text message or email, tell the user. Only
authenticator-app codes are saved in the vault.

Snapshots and evaluate results show filled values as `[filled value]`, and the
field is masked in screenshots. `bb 1password log` lists past fills, with no
values in it.
