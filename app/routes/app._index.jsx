/* global process */
import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const isTest =
  process.env.BILLING_IS_TEST === "true" ||
  process.env.NODE_ENV !== "production";

  const billingCheck = await billing.check({
    plans: ["monthlyPlan"],
    isTest,
  });

  return {
    hasActivePayment: billingCheck.hasActivePayment,
    shop: session.shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
  };
};

export const action = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const isTest =
  process.env.BILLING_IS_TEST === "true" ||
  process.env.NODE_ENV !== "production";

  try {
    return await billing.request({
      plan: "monthlyPlan",
      isTest,
    });
  } catch (error) {
    console.error("BILLING ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export default function Index() {
  const { hasActivePayment, shop, apiKey } = useLoaderData();
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const subscribe = () => fetcher.submit({}, { method: "POST" });

  useEffect(() => {
    if (fetcher.data?.confirmationUrl) {
      open(fetcher.data.confirmationUrl, "_top");
    }
  }, [fetcher.data]);

  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/trust-badges-bar`;

  if (!hasActivePayment) {
    return (
      <s-page heading="Trust Badges Bar">
        <s-section heading="Subscribe to activate trust badges">
          <s-paragraph>
            Start your 3-day free trial for $3.99/month. Add trust-boosting
            badges to your storefront in minutes - no coding required.
          </s-paragraph>
          <s-button
            variant="primary"
            onClick={subscribe}
            {...(isLoading ? { loading: true } : {})}
          >
            Start free trial
          </s-button>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Trust Badges Bar">
      <s-section heading="You're all set!">
        <s-paragraph>
          Your subscription is active. Follow these steps to show the trust
          badges bar at the top of your storefront:
        </s-paragraph>
        <s-ordered-list>
          <s-list-item>
            Click the button below to open the theme editor with App embeds.
          </s-list-item>
          <s-list-item>Turn on the Trust Badges Bar toggle.</s-list-item>
          <s-list-item>
            Edit the badge text and colors, then click Save.
          </s-list-item>
        </s-ordered-list>
        <s-button variant="primary" href={themeEditorUrl} target="_blank">
          Open theme editor
        </s-button>
      </s-section>

      <s-section heading="Need help?">
        <s-paragraph>
          If the bar does not appear after you save, open Online Store -
          Themes - Customize, click the App embeds icon on the left, and make
          sure Trust Badges Bar is switched on.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};