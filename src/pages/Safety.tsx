import { LegalPage } from "@/components/legal/LegalPage";
import { ShieldCheck, Lock, AlertTriangle } from "lucide-react";

const TIPS = [
  { icon: ShieldCheck, title: "Buy with protection", desc: "Always pay through Vylogue — never via off-platform links." },
  { icon: Lock, title: "Keep your account locked", desc: "Use a strong password and enable 2-step verification." },
  { icon: AlertTriangle, title: "Spot a scam?", desc: "Tap • • • on any post to report. Our team responds in under 1h." },
];

const Safety = () => (
  <LegalPage title="Safety Center" updated="April 2026">
    <p>
      Your safety powers everything we build. These are the basics of staying safe and
      making the most of Vylogue's protections.
    </p>

    <ul className="not-prose space-y-2">
      {TIPS.map((t) => (
        <li key={t.title} className="flex gap-3 rounded-2xl bg-card border border-border/60 p-4">
          <span className="h-10 w-10 rounded-xl gradient-brand shadow-brand flex items-center justify-center shrink-0">
            <t.icon className="h-5 w-5 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{t.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.desc}</p>
          </div>
        </li>
      ))}
    </ul>

    <section>
      <h3 className="text-base font-extrabold text-foreground">Reporting & moderation</h3>
      <p className="mt-1">
        Reports are reviewed by humans on our Trust & Safety team. Repeat offenders lose
        the ability to sell on Vylogue.
      </p>
    </section>

    <section>
      <h3 className="text-base font-extrabold text-foreground">Need help fast?</h3>
      <p className="mt-1">
        Call AETHØNN Inc. on <a className="text-brand-pink font-bold" href="tel:0573105096">0573105096</a> or
        email <a className="text-brand-pink font-bold" href="mailto:shopitt54@gmail.com">shopitt54@gmail.com</a>.
      </p>
    </section>
  </LegalPage>
);

export default Safety;
