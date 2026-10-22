/* global process */
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing, admin } = await authenticate.admin(request);

  // Development stores can't pay real charges, so use test charges there.
  // Real merchant stores are not development stores, so they are billed normally.
  const response = await admin.graphql(
    `#graphql
    query ShopPlan {
      shop {
        plan {
          partnerDevelopment
        }
      }
    }`
  );
  const json = await response.json();
  const isTest = json?.data?.shop?.plan?.partnerDevelopment === true;

  await billing.require({
    plans: ["monthlyPlan"],
    isTest,
    onFailure: async () =>
      billing.request({
        plan: "monthlyPlan",
        isTest,
      }),
  });

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};