import { LegalPage } from "@/components/legal/LegalPage";

const Terms = () => (
  <LegalPage title="Terms of Service" updated="April 2026">
    <section>
      <h3 className="text-base font-extrabold text-foreground">1. Welcome to Shopitt</h3>
      <p className="mt-1">
        Shopitt is a social commerce platform operated by VYLOGUE ENTERPRISES. By creating an account or
        using the app you agree to these Terms.
      </p>
    </section>
    <section>
      <h3 className="text-base font-extrabold text-foreground">2. Your account</h3>
      <p className="mt-1">
        You are responsible for the activity on your account. Keep your credentials safe and tell
        us right away if you suspect unauthorised access.
      </p>
    </section>
    <section>
      <h3 className="text-base font-extrabold text-foreground">3. Buying & selling</h3>
      <p className="mt-1">
        Sellers are responsible for the products and services they list. Buyers must pay for items
        they order. Shopitt facilitates the transaction and offers buyer protection on eligible
        purchases.
      </p>
    </section>
    <section>
      <h3 className="text-base font-extrabold text-foreground">4. Content</h3>
      <p className="mt-1">
        You retain ownership of the photos, videos and copy you post. By uploading content you grant
        Shopitt a worldwide licence to host and display it inside the app.
      </p>
    </section>
    <section>
      <h3 className="text-base font-extrabold text-foreground">5. Termination</h3>
      <p className="mt-1">
        We may suspend accounts that violate these Terms or our Community Guidelines. You may delete
        your account at any time from Menu → Account.
      </p>
    </section>
    <p className="text-xs text-muted-foreground">
      Full Terms in English. For other languages contact <a className="text-brand-pink font-bold" href="mailto:shopitt54@gmail.com">shopitt54@gmail.com</a>.
    </p>
  </LegalPage>
);

export default Terms;
