import Styles from './LegalPage.module.css';

export function TermsPage() {
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
                <h1 className={Styles.title}>Terms of Service</h1>
                <p className={Styles.meta}>Last updated: {updated}</p>

                <div className={Styles.highlight}>
                    By accessing or using OpenEmbedded ("the Service"), you agree to be bound
                    by these Terms of Service. Please read them carefully before using the platform.
                </div>

                <div className={Styles.section}>
                    <h2>1. About OpenEmbedded</h2>
                    <p>
                        OpenEmbedded (also known as discord.builders) is a visual editor for designing
                        Discord message components — including buttons, select menus, action rows,
                        embeds, and containers. It allows users to compose, preview, and export Discord
                        UI structures, and optionally send them via webhook or Discord bot.
                    </p>
                    <p>
                        OpenEmbedded is an independent tool and is not affiliated with, endorsed by,
                        or sponsored by Discord Inc.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>2. Eligibility</h2>
                    <p>
                        You must be at least 13 years of age to use the Service, in compliance with
                        Discord's own Terms of Service. By using OpenEmbedded, you confirm that you
                        meet this requirement.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>3. Accounts and Authentication</h2>
                    <p>
                        You may sign in using a verified email address or an existing Discord account
                        via OAuth2. You are responsible for maintaining the confidentiality of your
                        login credentials and for all activity that occurs under your account.
                    </p>
                    <p>
                        We reserve the right to terminate or suspend accounts at our discretion,
                        particularly in cases of abuse, misuse, or violation of these Terms.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>4. Permitted Use</h2>
                    <p>You agree to use OpenEmbedded only for lawful purposes. You may not:</p>
                    <ul>
                        <li>Use the Service to send spam, malware, or harmful content to Discord channels.</li>
                        <li>Attempt to reverse-engineer, disassemble, or tamker with the Service's infrastructure.</li>
                        <li>Use the Service in any way that violates Discord's Terms of Service or Community Guidelines.</li>
                        <li>Attempt to gain unauthorised access to any system, account, or data.</li>
                        <li>Use the Service for any commercial purpose without prior written consent.</li>
                    </ul>
                </div>

                <div className={Styles.section}>
                    <h2>5. Bot Tokens and Credentials</h2>
                    <p>
                        If you provide a Discord bot token to use the bot integration features, you
                        are solely responsible for ensuring that token is valid, authorised, and used
                        in accordance with Discord's Developer Terms of Service. OpenEmbedded stores
                        bot tokens only in memory for the duration of your session and does not
                        persist them to a database.
                    </p>
                    <p>
                        You must never share bot tokens with untrusted third parties. If a token is
                        compromised, regenerate it immediately in the Discord Developer Portal.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>6. Webhooks</h2>
                    <p>
                        Webhook URLs you enter are stored locally in your browser's localStorage and
                        are never transmitted to our servers. You are solely responsible for any
                        messages sent to Discord channels via webhooks using this tool.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>7. Intellectual Property</h2>
                    <p>
                        The OpenEmbedded platform, its source code, branding, and components-sdk
                        library are the intellectual property of their respective authors. The
                        components-sdk is licensed under the PolyForm Noncommercial License 1.0.0.
                    </p>
                    <p>
                        Message designs and code you generate using OpenEmbedded belong to you.
                        We claim no ownership over your content.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>8. Disclaimers and Limitation of Liability</h2>
                    <p>
                        OpenEmbedded is provided "as is" and "as available" without warranties of
                        any kind, either express or implied. We do not guarantee uninterrupted
                        availability, accuracy, or fitness for a particular purpose.
                    </p>
                    <p>
                        To the fullest extent permitted by law, OpenEmbedded and its operators shall
                        not be liable for any indirect, incidental, special, or consequential damages
                        arising from your use of the Service, including but not limited to loss of
                        data, loss of profits, or service interruption.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>9. Third-Party Services</h2>
                    <p>
                        OpenEmbedded integrates with Discord's API and OAuth2 services. Your use of
                        Discord through this tool is also subject to{' '}
                        <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer">
                            Discord's Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                        </a>.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>10. Changes to These Terms</h2>
                    <p>
                        We may update these Terms of Service at any time. Continued use of the
                        Service after changes are posted constitutes acceptance of the revised terms.
                        The "Last updated" date at the top of this page reflects the most recent revision.
                    </p>
                </div>

                <div className={Styles.section}>
                    <h2>11. Contact</h2>
                    <p>
                        If you have any questions about these Terms, please reach out via the
                        OpenEmbedded Discord server or the contact information listed on our website.
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
