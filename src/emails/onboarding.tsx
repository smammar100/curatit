import * as React from 'react';
import { Img, Text } from '@react-email/components';
import { Block, Body2, Button, Caption, Footer, H1, hiddenDarkImg, InlineLink, Layout, Lead, Rule } from './_components/layout';
import { appUrl, asset, color, font, radius } from './_components/tokens';

const l = color.light;

type StepKey = 'search' | 'save' | 'share';

export type OnboardingProps = {
  email: string;
  /** Which steps this person has already done. */
  done?: Partial<Record<StepKey, boolean>>;
  urls?: Partial<Record<StepKey, string>>;
  /** Resend: "{{{RESEND_UNSUBSCRIBE_URL}}}" */
  unsubscribeUrl?: string;
  /** Postal address, if you send these as marketing email. */
  address?: string;
};

const steps: { key: StepKey; title: string; body: string; link: string; cta: string }[] = [
  {
    key: 'search',
    title: 'Search by brief',
    body: "Write it the way you'd say it. Curatit reads it into objectives, formats and styles, and shows why each post matched.",
    link: 'Try a brief',
    cta: 'Search the library',
  },
  {
    key: 'save',
    title: 'Save to a board',
    body: 'Keep the references worth adapting, with notes on what to take from each. Boards are private by default.',
    link: 'Open the library',
    cta: 'Save your first post',
  },
  {
    key: 'share',
    title: 'Share a read-only link',
    body: 'Send your client the board. It opens without an account, leaves out your notes and expires within 30 days.',
    link: 'Open your boards',
    cta: 'Share a board',
  },
];

function headline(left: number) {
  if (left === 3) return 'From brief to board in 3 steps';
  if (left === 0) return "You've shared your first board";
  return `${left} ${left === 1 ? 'step' : 'steps'} left to your first board`;
}

export function getSubject(done: OnboardingProps['done'] = {}) {
  return headline(steps.filter((s) => !done[s.key]).length);
}

export default function Onboarding({ email, done = {}, urls = {}, unsubscribeUrl, address }: OnboardingProps) {
  const href: Record<StepKey, string> = {
    search: urls.search ?? `${appUrl}/dashboard`,
    save: urls.save ?? `${appUrl}/dashboard`,
    share: urls.share ?? `${appUrl}/dashboard?view=saved`,
  };
  const doneCount = steps.filter((s) => done[s.key]).length;
  const next = steps.find((s) => !done[s.key]);

  return (
    <Layout
      preview="Search by brief, save to a board, then share it with your client."
      footer={
        <Footer
          reason={<>You're getting this because you signed up for Curatit with {email}.</>}
          unsubscribeUrl={unsubscribeUrl}
          address={address}
        />
      }
    >
      <H1>{headline(3 - doneCount)}.</H1>
      <Lead style={{ marginTop: '12px' }}>Search by brief, save what's worth adapting, then hand your client one link.</Lead>

      {/* Progress */}
      <Block pt={28}>
        <Caption>
          {doneCount} of 3 done
        </Caption>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: '8px' }}>
          <tbody>
            <tr>
              {steps.map((s, i) => (
                <React.Fragment key={s.key}>
                  {i > 0 ? <td style={{ width: '4px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td> : null}
                  <td
                    className={done[s.key] ? 'c-ink' : 'c-track'}
                    style={{
                      height: '4px',
                      fontSize: 0,
                      lineHeight: 0,
                      borderRadius: radius.full,
                      backgroundColor: done[s.key] ? l.foreground : l.border,
                    }}
                  >
                    &nbsp;
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </Block>

      {/* Steps */}
      <Block pt={8}>
        {steps.map((s, i) => {
          const isDone = !!done[s.key];
          return (
            <React.Fragment key={s.key}>
              <Rule style={{ margin: '20px 0' }} />
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td style={{ width: '26px', verticalAlign: 'top', paddingTop: '0px' }}>
                      <StepMark n={i + 1} done={isDone} />
                    </td>
                    <td style={{ paddingLeft: '14px', verticalAlign: 'top' }}>
                      <Text
                        className={isDone ? 'c-muted' : 'c-fg'}
                        style={{
                          margin: 0,
                          fontFamily: font.sans,
                          fontSize: '16px',
                          lineHeight: '26px',
                          fontWeight: 600,
                          color: isDone ? l.muted : l.foreground,
                        }}
                      >
                        {s.title}
                      </Text>
                      {isDone ? (
                        <Caption style={{ marginTop: '2px' }}>Done</Caption>
                      ) : (
                        <>
                          <Body2 style={{ marginTop: '4px' }}>{s.body}</Body2>
                          <Text style={{ margin: '8px 0 0', fontFamily: font.sans, fontSize: '14px', lineHeight: '20px', fontWeight: 600 }}>
                            <InlineLink href={href[s.key]}>{s.link}</InlineLink>
                          </Text>
                        </>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </React.Fragment>
          );
        })}
      </Block>

      {next ? (
        <Block pt={32}>
          <Button href={href[next.key]}>{next.cta}</Button>
        </Block>
      ) : null}
    </Layout>
  );
}

// A done step gets an ink disc with a check; the rest show their number in an outline.
function StepMark({ n, done }: { n: number; done: boolean }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'separate' }}>
      <tbody>
        <tr>
          {done ? (
            <td
              className="c-ink"
              align="center"
              valign="middle"
              style={{ width: '26px', height: '26px', borderRadius: radius.full, backgroundColor: l.foreground }}
            >
              <Img className="img-light" src={asset('icon-check.png')} width="14" height="14" alt="Done" style={{ display: 'block', margin: '0 auto' }} />
              <Img className="img-dark" src={asset('icon-check-dark.png')} width="14" height="14" alt="" style={{ ...hiddenDarkImg, margin: '0 auto' }} />
            </td>
          ) : (
            <td
              className="c-rule c-fg"
              align="center"
              valign="middle"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: radius.full,
                border: `1px solid ${l.border}`,
                fontFamily: font.sans,
                fontSize: '13px',
                lineHeight: '24px',
                fontWeight: 600,
                color: l.foreground,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {n}
            </td>
          )}
        </tr>
      </tbody>
    </table>
  );
}

Onboarding.PreviewProps = {
  email: 'ammar@studio.co',
  done: { search: true },
  unsubscribeUrl: 'https://www.curatit.app/unsubscribe',
} satisfies OnboardingProps;
