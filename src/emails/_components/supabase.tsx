import * as React from 'react';
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
export const supabaseTemplates: [name: string, element: React.ReactElement][] = [
  ['confirm-signup', <ConfirmEmail email="{{ .Email }}" confirmUrl="{{ .ConfirmationURL }}" code="{{ .Token }}" />],
  ['reset-password', <ResetPassword email="{{ .Email }}" resetUrl="{{ .ConfirmationURL }}" />],
  ['change-email', <ChangeEmail email="{{ .Email }}" newEmail="{{ .NewEmail }}" confirmUrl="{{ .ConfirmationURL }}" />],
  ['reauthentication', <Reauthentication email="{{ .Email }}" code="{{ .Token }}" />],
  ['email-changed', <EmailChanged oldEmail="{{ .OldEmail }}" newEmail="{{ .Email }}" />],
  ['password-changed', <PasswordChanged email="{{ .Email }}" />],
];
