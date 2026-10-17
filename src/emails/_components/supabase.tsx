import * as React from 'react';
import { appUrl } from './tokens';
import ChangeEmail from '../change-email';
import ConfirmEmail from '../confirm-email';
import EmailChanged from '../email-changed';
import PasswordChanged from '../password-changed';
import Reauthentication from '../reauthentication';
import ResetPassword from '../reset-password';

// The six emails Supabase Auth sends itself, with its {{ .Placeholders }} in place of the
// values, which Supabase fills when it sends. `npm run email:render` writes each to
// supabase/templates/<name>.html for pasting into the dashboard; a test checks those files
// still match the templates.
//
// The links go to /auth/confirm, never straight to {{ .ConfirmationURL }}: that page uses the
// one-time token only when the person clicks, so a mail scanner that opens every link can't use
// it up first (Supabase's advice on email prefetching). {{ .RedirectTo }} carries where the flow
// was started to go next. The confirm email shows no code: Curatit has nowhere to type one.
const confirmLink = (type: 'email' | 'recovery' | 'email_change') =>
  `${appUrl}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next={{ .RedirectTo }}`;

export const supabaseTemplates: [name: string, element: React.ReactElement][] = [
  ['confirm-signup', <ConfirmEmail email="{{ .Email }}" confirmUrl={confirmLink('email')} />],
  ['reset-password', <ResetPassword email="{{ .Email }}" resetUrl={confirmLink('recovery')} />],
  ['change-email', <ChangeEmail email="{{ .Email }}" newEmail="{{ .NewEmail }}" confirmUrl={confirmLink('email_change')} />],
  ['reauthentication', <Reauthentication email="{{ .Email }}" code="{{ .Token }}" />],
  ['email-changed', <EmailChanged oldEmail="{{ .OldEmail }}" newEmail="{{ .Email }}" />],
  ['password-changed', <PasswordChanged email="{{ .Email }}" />],
];

// The saved files are plain ASCII: every other character (the preheader's invisible padding, the
// footer's middle dot) is written as an HTML entity. The first confirm email Supabase sent
// (2026-10-17) showed them garbled, "Â â€Œâ€‹" in the inbox preview, because the pasted text
// went through the wrong encoding on its way into the dashboard; an entity survives any copy.
// (No template has such a character inside <style>, where an entity wouldn't be decoded.)
export const asciiHtml = (html: string) =>
  html.replace(/[^\x00-\x7f]/gu, (ch) => `&#x${ch.codePointAt(0)!.toString(16).toUpperCase()};`);
