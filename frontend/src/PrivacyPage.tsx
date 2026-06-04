import Styles from './LegalPage.module.css';

export function PrivacyPage() {
    const updated = 'June 4, 2025';

    return (
        <div className={Styles.page}>
            <header className={Styles.header}>
                <a className={Styles.logo} href="/">
                    <img src="/logo.png" alt="OpenEmbedded" />
                    OpenEmbedded
                </a>
                <a className={Styles.back} href="/">← Back to app</a>
            </header>

            <main className={Styles.content}>
                <div className={Styles.badge}>Legal</div>
                <h1 className={Styles.title}>Privacy Policy</h1>
                <p className={Styles.meta}>Last updated: {updated}</p>

                <div className={Styles.highlight}>
                    Your privacy matters to us. This policy explains what data OpenEmbedded collects,
                    how it is used, and the choices you have. We collect only what is necessary
                    to provide the Service.
                </div>

                <div className={Styles.section}>
                    <h2>1. Who We Are</h2>
                    <p>
                        OpenEmbedded (discord.builders) is a visual Discord component builder.
                        References to "we", "us", or "our" in this policy refer to the OpenEmbedded
                        platform and its operators. We are not affiliated with Discord Inc.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>2. Information We Collect</h2>

                    <p><strong style={{ color: '#dcddde' }}>When you sign in via Email:</strong></p>
                    <ul>
                        <li>Your email address (used to send a one-time verification link).</li>
                        <li>A session identifier stored in a signed, HTTP-only cookie.</li>
                        <li>A short-lived verification token stored in our database, deleted after use or expiry (30 minutes).</li>
                    </ul>

                    <p><strong style={{ color: '#dcddde' }}>When you sign in via Discord OAuth2:</strong></p>
                    <ul>
                        <li>Your Discord user ID, username, discriminator, avatar hash, and email address (if visible on your Discord account).</li>
                        <li>A temporary OAuth2 access token, held in server memory only for the duration of your session to maintain your Discord Rich Presence activity. It is not written to a database.</li>
                        <li>A session identifier stored in a signed, HTTP-only cookie.</li>
                    </ul>

                    <p><strong style={{ color: '#dcddde' }}>Automatically collected:</strong></p>
                    <ul>
                        <li>IP addresses, stored temporarily for rate-limiting purposes (in-memory only, cleared on server restart).</li>
                        <li>Standard server logs (request method, path, status code) for debugging.</li>
                    </ul>
                </div>

                <div className={Styles.section}>
                    <h2>3. Information We Do NOT Collect</h2>
                    <ul>
                        <li><strong>Webhook URLs</strong> — stored exclusively in your browser's localStorage. Never transmitted to our servers.</li>
                        <li><strong>Bot tokens</strong> — held only in server memory for the active session and never written to a database.</li>
                        <li><strong>Message content or component designs</strong> — the components you build are stored in your browser's URL hash and local storage only.</li>
                        <li><strong>Payment information</strong> — OpenEmbedded does not charge for its service and collects no payment data.</li>
                        <li><strong>Tracking or advertising data</strong> — we use no analytics services, ad networks, or third-party tracking pixels.</li>
                    </ul>
                </div>

                <div className={Styles.section}>
                    <h2>4. How We Use Your Information</h2>
                    <ul>
                        <li>To authenticate you and maintain your login session.</li>
                        <li>To send one-time verification emails when you sign in via email.</li>
                        <li>To set a Discord Rich Presence activity on your Discord profile (Discord-login users only, requires your consent via the OAuth2 consent screen).</li>
                        <li>To protect the Service from abuse via rate limiting.</li>
                    </ul>
                    <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
                </div>

                <div className={Styles.section}>
                    <h2>5. Cookies and Local Storage</h2>
                    <p>
                        OpenEmbedded uses a single session cookie (<code style={{ background: '#2e2f3e', padding: '0.1em 0.4em', borderRadius: '4px', fontSize: '0.9em' }}>oe_session</code>) to maintain
                        your authenticated session. This cookie is:
                    </p>
                    <ul>
                        <li><strong>HTTP-only</strong> — not accessible to JavaScript.</li>
                        <li><strong>Signed</strong> — tamper-evident using a server-side secret key.</li>
                        <li><strong>SameSite: Lax</strong> — protected against cross-site request forgery.</li>
                        <li><strong>Expiry: 7 days</strong> — automatically cleared after one week of inactivity.</li>
                    </ul>
                    <p>
                        We also use browser localStorage to remember your webhook URL, selected
                        code-generation library, and current component state. This data never
                        leaves your browser.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>6. Data Retention</h2>
                    <ul>
                        <li><strong>Session data</strong> — cleared automatically after 7 days, or immediately on logout.</li>
                        <li><strong>Verification tokens</strong> — deleted from the database after use or after 30-minute expiry.</li>
                        <li><strong>Discord OAuth tokens</strong> — held in server memory only; cleared on logout or server restart.</li>
                        <li><strong>Button action configurations</strong> — stored in the database linked to their custom IDs (not to your account). You can delete them by clearing your bot's actions.</li>
                    </ul>
                </div>

                <div className={Styles.section}>
                    <h2>7. Third-Party Services</h2>
                    <p>
                        OpenEmbedded communicates with the following third-party services on your behalf:
                    </p>
                    <ul>
                        <li>
                            <strong>Discord API</strong> — for OAuth2 authentication, Rich Presence,
                            and bot operations. Governed by{' '}
                            <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">
                                Discord's Privacy Policy
                            </a>.
                        </li>
                        <li>
                            <strong>Gmail SMTP</strong> — used to deliver verification emails.
                            Only your email address is transmitted; no other data is shared.
                        </li>
                    </ul>
                    <p>No other third-party services receive your data.</p>
                </div>

                <div className={Styles.section}>
                    <h2>8. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
                        <li><strong>Deletion</strong> — request deletion of your account and associated data.</li>
                        <li><strong>Correction</strong> — request correction of inaccurate data.</li>
                        <li><strong>Withdrawal of consent</strong> — revoke Discord OAuth access at any time via Discord's{' '}
                            <a href="https://discord.com/settings/authorized-apps" target="_blank" rel="noopener noreferrer">
                                Authorized Apps
                            </a>{' '}settings.
                        </li>
                    </ul>
                    <p>
                        To exercise any of these rights, please contact us via the OpenEmbedded
                        Discord server or the contact details on our website.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>9. Security</h2>
                    <p>
                        We take reasonable technical measures to protect your data, including
                        signed and HTTP-only session cookies, server-side token validation,
                        and in-memory-only storage of sensitive credentials. However, no system
                        is completely secure and we cannot guarantee absolute security.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>10. Children's Privacy</h2>
                    <p>
                        OpenEmbedded is not directed at children under 13. We do not knowingly
                        collect personal data from children under 13. If you believe a child has
                        provided us with personal data, please contact us so we can delete it.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>11. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. The "Last updated"
                        date at the top reflects the most recent revision. Continued use of the
                        Service after updates constitutes acceptance of the revised policy.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>12. Contact</h2>
                    <p>
                        For privacy-related questions or data requests, please contact us through
                        the OpenEmbedded Discord server or the contact information listed on our website.
                    </p>
                </div>
            </main>

            <footer className={Styles.footer}>
                <span>© {new Date().getFullYear()} OpenEmbedded</span>
                <nav className={Styles.footerLinks}>
                    <a href="/terms">Terms of Service</a>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/">App</a>
                </nav>
            </footer>
        </div>
    );
}
