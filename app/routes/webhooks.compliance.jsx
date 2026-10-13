   import { authenticate } from "../shopify.server";
   import db from "../db.server";

   export const action = async ({ request }) => {
     const { shop, topic } = await authenticate.webhook(request);

     console.log(`Received ${topic} webhook for ${shop}`);

     if (topic === "customers/data_request") {
       // This app does not store any personal data about the shop's
       // customers, so there is no customer data to return.
     }

     if (topic === "customers/redact") {
       // This app does not store any personal data about the shop's
       // customers, so there is no customer data to delete.
     }

     if (topic === "shop/redact") {
       // Shop has requested full data erasure (48 hours after uninstall).
       await db.session.deleteMany({ where: { shop } });
     }

     return new Response();
   };