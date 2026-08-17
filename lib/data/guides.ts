// Step-by-step guides for importing the USAgentLeads CSV (columns: name,
// email, phone, state) into popular tools. Steps follow each vendor's official
// help-center import flow, verified July 2026; docsUrl links the source article.
export interface ImportGuide {
  slug: string
  tool: string
  category: "Cold Email" | "Email Marketing" | "CRM"
  title: string
  headline: string
  description: string
  docsUrl: string
  prerequisites: string[]
  steps: { title: string; detail: string }[]
  fieldMapping: { ourColumn: string; toolField: string; note?: string }[]
  tips: string[]
  faqs: { question: string; answer: string }[]
}

/** Shared prep advice — the CSV ships with name, email, phone, state columns */
const SPLIT_NAME_NOTE =
  "The CSV has a single name column. If you want {{first_name}} personalization, split it first: in Google Sheets, use =SPLIT(A2, \" \") in a helper column, or Excel's Data → Text to Columns with a space delimiter."

export const IMPORT_GUIDES: readonly ImportGuide[] = [
  {
    slug: "import-leads-into-instantly",
    tool: "Instantly",
    category: "Cold Email",
    title: "Import a Realtor Email List into Instantly",
    headline: "How to Import Your Agent List into Instantly",
    description:
      "Instantly is one of the most popular cold-email platforms for agency and B2B outreach. Importing your USAgentLeads CSV takes about five minutes: upload the file into a campaign, map the email column, and set your duplicate and verification options.",
    docsUrl: "https://help.instantly.ai/en/articles/6254215-how-to-import-leads-via-csv",
    prerequisites: [
      "An Instantly account with at least one sending account connected and warmed up",
      "Your USAgentLeads CSV (columns: name, email, phone, state)",
      "Optional: name column split into first/last for personalization",
    ],
    steps: [
      {
        title: "Open your campaign's Leads section",
        detail:
          "In Instantly, open (or create) the campaign you'll send from, go to the Leads section, and click 'Add Leads'. Choose the CSV upload option and select your USAgentLeads file.",
      },
      {
        title: "Let Instantly detect the columns",
        detail:
          "Instantly automatically detects each column in the file and suggests a variable for it. Confirm the email column is mapped to the predefined 'Email' variable — it's the one mandatory field.",
      },
      {
        title: "Map the remaining columns",
        detail:
          "Map name, phone, and state as custom variables (or first/last name if you split the column). Any column you don't need can be set to 'Do Not Import'.",
      },
      {
        title: "Set duplicate protection",
        detail:
          "Leave the options checked that skip leads already present in another campaign or list — this prevents double-emailing the same agent if you run multiple state campaigns.",
      },
      {
        title: "Optionally verify the leads",
        detail:
          "Instantly can verify emails at upload for 0.25 Instantly credits per lead. Verification reduces bounces, which protects your sender reputation on large sends.",
      },
      {
        title: "Upload",
        detail:
          "Click 'Upload All'. Instantly flags any rows with missing or malformed email addresses before the import completes.",
      },
    ],
    fieldMapping: [
      { ourColumn: "email", toolField: "Email", note: "Required — map to the predefined Email variable" },
      { ourColumn: "name", toolField: "Custom variable (e.g. {{name}})", note: "Split into firstName/lastName for better personalization" },
      { ourColumn: "phone", toolField: "Custom variable", note: "Useful for follow-up calling workflows" },
      { ourColumn: "state", toolField: "Custom variable", note: "Reference in copy: “agents in {{state}}”" },
    ],
    tips: [
      "Don't blast the full 1M list from one inbox — Instantly's own best practices favor multiple warmed sending accounts with low daily volumes per account.",
      "Segment campaigns by state (the CSV's state column) so subject lines can reference the agent's market.",
      "Follow CAN-SPAM: real from-address, your business address in the footer, and a working unsubscribe link.",
      SPLIT_NAME_NOTE,
    ],
    faqs: [
      {
        question: "Should I pay for Instantly's verification credits?",
        answer:
          "For large sends it's usually worth it — verification at 0.25 credits per lead cuts bounces, and bounce rate is the fastest way to burn a sending domain. Alternatively, run the list through a bulk verifier before upload.",
      },
      {
        question: "Can I upload one state at a time?",
        answer:
          "Yes — either buy individual $99 state packs, or filter the full CSV by the state column in a spreadsheet and upload each slice to its own campaign.",
      },
    ],
  },
  {
    slug: "import-leads-into-smartlead",
    tool: "Smartlead",
    category: "Cold Email",
    title: "Import a Realtor Email List into Smartlead",
    headline: "How to Import Your Agent List into Smartlead",
    description:
      "Smartlead is a cold-email platform built around unlimited sender rotation. Your USAgentLeads CSV imports directly into a campaign — Smartlead auto-maps standard fields and supports up to 40 custom variables per lead.",
    docsUrl: "https://helpcenter.smartlead.ai/en/articles/409-how-to-map-csv-columns-in-smartlead-campaigns",
    prerequisites: [
      "A Smartlead account with sending accounts connected",
      "Your USAgentLeads CSV (columns: name, email, phone, state)",
    ],
    steps: [
      {
        title: "Open the campaign editor",
        detail:
          "Go to the Campaigns tab, select the campaign you want to fill (or create one), and click Edit to reach the Import Leads section.",
      },
      {
        title: "Import the CSV",
        detail:
          "Click 'Import CSV' and select your USAgentLeads file from local storage.",
      },
      {
        title: "Choose import options",
        detail:
          "Smartlead offers two useful toggles before import: skip leads that bounced in past campaigns across its database, and ignore leads that already exist in another campaign. Enable both for cleaner sending.",
      },
      {
        title: "Map the columns",
        detail:
          "Smartlead auto-maps standard fields like Name and Email. Map phone and state to custom variables via the dropdown — you can store up to 40 custom variables per lead for personalization.",
      },
      {
        title: "Save and review the summary",
        detail:
          "Click Save. Smartlead shows a summary report of how many leads were imported, skipped, or rejected.",
      },
    ],
    fieldMapping: [
      { ourColumn: "email", toolField: "Email", note: "Auto-mapped" },
      { ourColumn: "name", toolField: "Name", note: "Auto-mapped; split for first-name personalization" },
      { ourColumn: "phone", toolField: "Custom variable", note: "Map via dropdown" },
      { ourColumn: "state", toolField: "Custom variable", note: "Use in copy and for segmenting follow-ups" },
    ],
    tips: [
      "Enable both duplicate/bounce toggles on import — with a list this size, suppression is what keeps deliverability healthy.",
      "Split the send across many mailboxes with low per-inbox volume; Smartlead's sender rotation is designed for exactly this.",
      "Use the state column to break the database into per-state campaigns with localized copy.",
      SPLIT_NAME_NOTE,
    ],
    faqs: [
      {
        question: "How many custom variables can I attach to each lead?",
        answer:
          "Smartlead supports up to 40 custom variables per lead, so name, phone, and state fit easily alongside any enrichment columns you add later.",
      },
      {
        question: "Does Smartlead deduplicate against my other campaigns?",
        answer:
          "Yes — check 'Ignore the leads that exist in another campaign' during import and Smartlead skips any agent already present elsewhere in your workspace.",
      },
    ],
  },
  {
    slug: "import-leads-into-lemlist",
    tool: "lemlist",
    category: "Cold Email",
    title: "Import a Realtor Email List into lemlist",
    headline: "How to Import Your Agent List into lemlist",
    description:
      "lemlist focuses on personalized cold outreach with image and video personalization. Importing your USAgentLeads CSV is a campaign-level upload with a variable-mapping step — plus one formatting rule that catches most people: column names must not contain spaces.",
    docsUrl: "https://help.lemlist.com/en/articles/4515109-import-leads-from-a-csv-file",
    prerequisites: [
      "A lemlist account with a sending identity configured",
      "Your USAgentLeads CSV — headers are already lowercase single words (name, email, phone, state), which matches lemlist's no-spaces rule",
    ],
    steps: [
      {
        title: "Open the campaign's lead list",
        detail:
          "Go to Campaigns, open the campaign you're importing into, click 'Lead list', then 'Import new leads' and select CSV import.",
      },
      {
        title: "Upload the file",
        detail:
          "Click to upload (or drag and drop) the CSV, then click Continue. The first row must be column headers — the USAgentLeads file ships that way.",
      },
      {
        title: "Assign variables",
        detail:
          "In the 'Set up imported custom variables' step, confirm each column maps to the right lemlist variable. The email column is recognized automatically as {{email}}; map name, phone, and state so they're usable in your copy.",
      },
      {
        title: "Skip or configure AI and enrichment steps",
        detail:
          "lemlist offers optional AI column suggestions and paid enrichment (email finding/verification, phone lookup). Your list already has emails and phones, so these are optional — enable email verification only if you want an extra bounce check.",
      },
      {
        title: "Finish the import",
        detail:
          "Confirm to add the leads to the campaign, then review the lead list before launching your sequence.",
      },
    ],
    fieldMapping: [
      { ourColumn: "email", toolField: "{{email}}", note: "Auto-recognized standard variable" },
      { ourColumn: "name", toolField: "Custom variable (or {{firstName}} after splitting)", note: "lemlist auto-recognizes firstName if you split the column" },
      { ourColumn: "phone", toolField: "{{phone}} / custom variable" },
      { ourColumn: "state", toolField: "Custom variable", note: "Great for localized first lines" },
    ],
    tips: [
      "lemlist skips a lead if the first data row looks like a header issue — keep the header row intact and don't add blank rows above it.",
      "Column names with spaces break variable mapping in lemlist; the USAgentLeads headers are already space-free, so don't rename them with spaces.",
      "Use the state variable in your opening line — localized cold email consistently outperforms generic sends.",
      SPLIT_NAME_NOTE,
    ],
    faqs: [
      {
        question: "Do I need lemlist's enrichment add-ons?",
        answer:
          "Not for this list — it already includes emails and phone numbers. lemlist enrichment is useful when you upload leads with missing fields; here it would mostly duplicate data you already bought.",
      },
      {
        question: "Can lemlist deduplicate against another campaign?",
        answer:
          "lemlist supports importing leads from another campaign and reviewing duplicates in the lead list. If you run per-state campaigns from the full database, slice the CSV by state first so each campaign gets a disjoint list.",
      },
    ],
  },
  {
    slug: "import-contacts-into-mailchimp",
    tool: "Mailchimp",
    category: "Email Marketing",
    title: "Import a Realtor Email List into Mailchimp",
    headline: "How to Import Your Agent List into Mailchimp",
    description:
      "Mailchimp is the most widely used email marketing platform for newsletters and drip campaigns. Importing your USAgentLeads CSV goes through the Audience importer: upload, map the email column, tag the contacts, and choose their subscription status.",
    docsUrl: "https://mailchimp.com/help/import-contacts-mailchimp/",
    prerequisites: [
      "A Mailchimp account and an Audience to import into",
      "Your USAgentLeads CSV (columns: name, email, phone, state)",
      "A plan tier with enough contact capacity — Mailchimp bills by audience size",
    ],
    steps: [
      {
        title: "Start the import",
        detail:
          "In Mailchimp, click Audience, then the 'Add contacts' drop-down, and choose 'Import contacts'. Select 'Upload a file' and continue.",
      },
      {
        title: "Upload the CSV",
        detail:
          "Click 'Select a file' (or drag and drop) to upload the USAgentLeads CSV, then click Continue. Mailchimp accepts comma-separated CSV — if your spreadsheet app exported semicolons, re-save with commas.",
      },
      {
        title: "Pick the audience and status",
        detail:
          "Confirm the target audience in the drop-down and choose the contacts' status. For purchased B2B contact data, treat recipients appropriately for your jurisdiction and sending strategy — many senders use transactional-style, clearly identified B2B outreach with immediate opt-out.",
      },
      {
        title: "Map the columns",
        detail:
          "Mailchimp requires the Email Address field; map our email column to it. Map name to a text merge field (or First/Last Name if you split it), and phone and state to text fields you create during mapping.",
      },
      {
        title: "Tag and organize",
        detail:
          "Add a tag like 'usagentleads-jul-2026' plus per-state tags if you'll segment sends. If your audience uses groups, you can import straight into a group.",
      },
      {
        title: "Complete and review",
        detail:
          "Finish the import and review the summary of added, updated, and skipped contacts.",
      },
    ],
    fieldMapping: [
      { ourColumn: "email", toolField: "Email Address", note: "Required field" },
      { ourColumn: "name", toolField: "First Name / Last Name merge fields", note: "Split the column first, or map to a single text field" },
      { ourColumn: "phone", toolField: "Phone Number field" },
      { ourColumn: "state", toolField: "Text merge field (e.g. STATE)", note: "Use for segments: State = TX" },
    ],
    tips: [
      "Mailchimp prices by contact count — importing all 1M contacts lands in high pricing tiers. Import only the states you're actively mailing.",
      "Create a segment per state from the STATE merge field instead of separate audiences; multiple audiences multiply cost.",
      "Mailchimp enforces its acceptable-use rules on bounces and abuse reports, so verify the list slice before a first big send and always include a clean unsubscribe path.",
      SPLIT_NAME_NOTE,
    ],
    faqs: [
      {
        question: "Will Mailchimp accept a purchased list?",
        answer:
          "Mailchimp's acceptable-use policy is strict about consent-based sending, and high bounce or complaint rates can suspend an account. Many buyers use Mailchimp for opted-in nurture and a dedicated cold-outreach tool (Instantly, Smartlead) for first-touch emails — that split keeps both channels healthy.",
      },
      {
        question: "How do I keep my Mailchimp bill down with a big list?",
        answer:
          "Import per-state slices as you campaign rather than the full database at once, and archive segments you've finished mailing. Your CSV is reusable — Mailchimp doesn't need to hold contacts you aren't actively sending to.",
      },
    ],
  },
  {
    slug: "import-contacts-into-activecampaign",
    tool: "ActiveCampaign",
    category: "Email Marketing",
    title: "Import a Realtor Email List into ActiveCampaign",
    headline: "How to Import Your Agent List into ActiveCampaign",
    description:
      "ActiveCampaign combines email marketing with automation workflows. The CSV importer lives under Contacts → Import, with per-column field mapping, list selection, and tagging in one flow.",
    docsUrl: "https://help.activecampaign.com/hc/en-us/articles/221467787-Import-contacts-from-a-CSV-file",
    prerequisites: [
      "An ActiveCampaign account with a list created for these contacts",
      "Your USAgentLeads CSV (columns: name, email, phone, state)",
    ],
    steps: [
      {
        title: "Open the importer",
        detail:
          "Click 'Contacts' in the left menu, then the 'Import' button, then 'Import from File' and choose your CSV.",
      },
      {
        title: "Map each column",
        detail:
          "Use the dropdown next to each column to map it to a contact field. Map email to Email, phone to Phone, and create a custom field for state directly from the import page via '[Add New Field]'. Columns you don't want can be set to 'Do Not Import this Field'.",
      },
      {
        title: "Select lists and tags",
        detail:
          "Pick the list(s) these agents should join and add tags (e.g. 'realtor-list', per-state tags). Tags are the easiest way to segment automations later.",
      },
      {
        title: "Choose import options and run",
        detail:
          "Open the 'Import Options' dropdown, keep 'Import as Contact', and start the import. ActiveCampaign requires an email or phone per row — every USAgentLeads record has an email, so rows won't be dropped for missing identifiers.",
      },
      {
        title: "Verify the results",
        detail:
          "Check the import summary. Note that if multiple rows share an email, ActiveCampaign keeps the first and skips the rest — a free layer of dedupe.",
      },
    ],
    fieldMapping: [
      { ourColumn: "email", toolField: "Email", note: "Standard field; required identifier" },
      { ourColumn: "name", toolField: "First Name / Last Name", note: "Split first, or map to a custom text field" },
      { ourColumn: "phone", toolField: "Phone" },
      { ourColumn: "state", toolField: "Custom field (create during import)", note: "Use in segments and automation conditions" },
    ],
    tips: [
      "Create the state custom field during mapping — it takes one click and unlocks per-state automations.",
      "ActiveCampaign bills by contact count; import per-state slices as you campaign instead of all 1M at once.",
      "Route first-touch cold outreach through a dedicated cold-email tool and use ActiveCampaign for engaged replies and nurture — engagement-based platforms punish cold-list bounce rates.",
      SPLIT_NAME_NOTE,
    ],
    faqs: [
      {
        question: "Does ActiveCampaign deduplicate on import?",
        answer:
          "Yes — when multiple contacts in the file share an email address, the first instance is imported and the rest are skipped. Re-importing an existing email updates that contact rather than duplicating it.",
      },
      {
        question: "Can I trigger an automation from the import?",
        answer:
          "Tag the imported contacts during the import, then use that tag as an automation start trigger. That pattern lets you drip to the new list without touching existing contacts.",
      },
    ],
  },
  {
    slug: "import-contacts-into-brevo",
    tool: "Brevo",
    category: "Email Marketing",
    title: "Import a Realtor Email List into Brevo",
    headline: "How to Import Your Agent List into Brevo",
    description:
      "Brevo (formerly Sendinblue) prices by emails sent rather than contacts stored, which makes it a popular home for large lists. The importer accepts CSV, XLSX, and TXT, with attribute mapping and inline attribute creation.",
    docsUrl: "https://help.brevo.com/hc/en-us/articles/115000719584-Import-your-contacts-to-Brevo",
    prerequisites: [
      "A Brevo account with a contact list created",
      "Your USAgentLeads CSV — it's already UTF-8, which Brevo requires to avoid character issues",
    ],
    steps: [
      {
        title: "Start the import",
        detail:
          "Go to Contacts and choose the import option. Upload the CSV (Brevo also accepts .xlsx and .txt).",
      },
      {
        title: "Review the preview",
        detail:
          "Brevo shows a preview of the parsed rows. Confirm the four columns (name, email, phone, state) separated cleanly — if not, the file's delimiter needs fixing before continuing.",
      },
      {
        title: "Map attributes",
        detail:
          "Match each column to a Brevo contact attribute: email → EMAIL, phone → SMS or a text attribute, name → FIRSTNAME/LASTNAME or a custom attribute. Don't skip mapping — unmapped data can't be used for segmentation later.",
      },
      {
        title: "Create the STATE attribute inline",
        detail:
          "Under Contact attributes, click 'Add a new attribute', name it STATE, and map our state column to it. Brevo lets you create attributes without leaving the import flow.",
      },
      {
        title: "Confirm the import",
        detail:
          "Choose the destination list, confirm the file, and let Brevo process it. Every USAgentLeads row has an EMAIL value, which satisfies Brevo's identifier requirement.",
      },
    ],
    fieldMapping: [
      { ourColumn: "email", toolField: "EMAIL", note: "Required identifier" },
      { ourColumn: "name", toolField: "FIRSTNAME / LASTNAME", note: "Split first, or use a custom attribute" },
      { ourColumn: "phone", toolField: "SMS or custom text attribute", note: "SMS attribute expects international format; a text attribute is safer for raw US numbers" },
      { ourColumn: "state", toolField: "Custom attribute STATE (create inline)" },
    ],
    tips: [
      "Brevo charges by email volume, not list size — you can store the full database and pay only for what you send.",
      "Map phone to a plain text attribute unless you've normalized numbers to E.164 (+1...) format; the SMS field validates formatting.",
      "Use the STATE attribute to build one segment per campaign region.",
      SPLIT_NAME_NOTE,
    ],
    faqs: [
      {
        question: "Why Brevo over Mailchimp for a large purchased list?",
        answer:
          "Cost structure. Mailchimp bills by stored contacts; Brevo bills by emails sent. Storing 1M contacts is expensive on contact-billed platforms and effectively free on Brevo — you pay per campaign instead.",
      },
      {
        question: "My import shows garbled characters — what happened?",
        answer:
          "That's an encoding issue. The USAgentLeads CSV ships as UTF-8; if you re-saved it in a spreadsheet app, export it again as CSV UTF-8 before uploading.",
      },
    ],
  },
  {
    slug: "import-contacts-into-gohighlevel",
    tool: "GoHighLevel",
    category: "CRM",
    title: "Import a Realtor Email List into GoHighLevel",
    headline: "How to Import Your Agent List into GoHighLevel",
    description:
      "GoHighLevel is the agency-favorite CRM with built-in email, SMS, and pipelines. Contact imports are CSV-only, capped at 30 MB per file, and admin-restricted — here's the exact flow for your USAgentLeads list.",
    docsUrl: "https://help.gohighlevel.com/support/solutions/articles/155000004432-importing-contacts-using-a-csv-file",
    prerequisites: [
      "Admin access to the GoHighLevel sub-account (only admins can import)",
      "Your USAgentLeads CSV under 30 MB — the full database exceeds this, so split it (per-state files stay well under the cap)",
    ],
    steps: [
      {
        title: "Open the contact importer",
        detail:
          "Navigate to Contacts in the left menu and click 'Import Contacts'. Choose to import Contacts (not Opportunities) and click Next.",
      },
      {
        title: "Upload the CSV",
        detail:
          "Click 'Upload File' and select your file. GoHighLevel accepts only .csv — no Excel or Google Sheets files — and requires a header row, which the USAgentLeads file has.",
      },
      {
        title: "Choose create vs update",
        detail:
          "Pick how to import: create new contacts, update existing ones, or both. For a first import, 'create' is right; use 'both' when re-importing a refreshed list.",
      },
      {
        title: "Map the fields",
        detail:
          "Map email → Email, phone → Phone, name → First Name/Last Name (or a custom field), and state → a custom field or the address State field. Unmapped columns are ignored automatically; confirm all mandatory mappings before proceeding.",
      },
      {
        title: "Fill in import details and run",
        detail:
          "Name the import, optionally add contacts to a smart list/tag, set consent preferences, and click 'Bulk Import'.",
      },
      {
        title: "Monitor under Bulk Actions",
        detail:
          "Track progress and completion status on the Bulk Actions page, which lists every import with counts.",
      },
    ],
    fieldMapping: [
      { ourColumn: "email", toolField: "Email" },
      { ourColumn: "name", toolField: "First Name / Last Name", note: "GHL expects split names; use Text to Columns first" },
      { ourColumn: "phone", toolField: "Phone" },
      { ourColumn: "state", toolField: "State (address) or custom field" },
    ],
    tips: [
      "Split large files: per-state CSVs keep you under the 30 MB limit and map cleanly to per-client campaigns if you're an agency.",
      "Tag every import ('usagentleads' + state) so smart lists and workflows can target exactly the batch you uploaded.",
      "GoHighLevel needs at least one of name, email, or phone per row — every row in this list has all of email and name, so nothing gets rejected on identifiers.",
      SPLIT_NAME_NOTE,
    ],
    faqs: [
      {
        question: "Why is my import button missing?",
        answer:
          "Contact imports are restricted to users with Admin access in the sub-account. If you're on a User role, ask an admin to run the import or upgrade your role.",
      },
      {
        question: "How do agencies use this list across client sub-accounts?",
        answer:
          "Import the relevant state slice into each client's sub-account with a client-specific tag. The one-time license covers your business use across campaigns — see the terms page for raw-data resale restrictions.",
      },
    ],
  },
  {
    slug: "import-leads-into-close-crm",
    tool: "Close",
    category: "CRM",
    title: "Import a Realtor Email List into Close CRM",
    headline: "How to Import Your Agent List into Close",
    description:
      "Close is a sales-team CRM with built-in calling and email. Its Lead Importer accepts CSV and Excel files, maps columns to lead and contact fields, and — usefully for a big list — runs a sample import first so you can catch mapping mistakes before committing.",
    docsUrl: "https://help.close.com/docs/importing-leads-from-file",
    prerequisites: [
      "A Close account with permission to import data",
      "Your USAgentLeads CSV (a header row is required — included by default)",
      "Any custom fields (like State) created in Close settings beforehand",
    ],
    steps: [
      {
        title: "Open the Lead Importer",
        detail:
          "Click your name in the upper right of Close and choose 'Import data'. Drag and drop the CSV onto the importer or browse to it.",
      },
      {
        title: "Create a State custom field first (if needed)",
        detail:
          "Close maps columns only to existing fields — custom fields must be created in Settings before the import. Add a 'State' lead custom field if you don't have one.",
      },
      {
        title: "Map the columns",
        detail:
          "Assign each CSV column to a Close field: name → Contact Name, email → Contact Email, phone → Contact Phone, state → your State custom field.",
      },
      {
        title: "Run the sample import",
        detail:
          "Close first imports a small sample. Open a few sample leads and confirm names, emails, and the state field landed correctly.",
      },
      {
        title: "Perform the full import",
        detail:
          "Back on the import page, click 'Perform Full Import'. When it finishes, the summary shows how many leads were created, skipped, or failed validation.",
      },
    ],
    fieldMapping: [
      { ourColumn: "name", toolField: "Contact Name", note: "Close accepts full names on contacts" },
      { ourColumn: "email", toolField: "Contact Email" },
      { ourColumn: "phone", toolField: "Contact Phone" },
      { ourColumn: "state", toolField: "Lead custom field (create first)" },
    ],
    tips: [
      "Use the sample-import step seriously — fixing a mapping mistake on 50 leads beats fixing it on 50,000.",
      "Close treats a 'lead' as the company/record and 'contacts' as people under it; for solo agents, one lead per agent with a single contact is the clean shape.",
      "Import per-state slices and use Smart Views filtered on the State field as calling queues.",
    ],
    faqs: [
      {
        question: "CSV or Excel — which should I upload?",
        answer:
          "Close accepts both .csv and .xlsx. The USAgentLeads file is CSV already; upload it as-is unless you've been editing in Excel, in which case either format works.",
      },
      {
        question: "What happens to rows that fail validation?",
        answer:
          "The post-import summary reports created, skipped, and failed counts. Failures are typically malformed emails; you can export the failures, fix them, and re-import just those rows.",
      },
    ],
  },
] as const

export function getGuideBySlug(slug: string): ImportGuide | undefined {
  return IMPORT_GUIDES.find((g) => g.slug === slug)
}
