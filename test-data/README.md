# Test Data for TenderWin

This folder contains sample data for manual testing and the demo.

## What’s included

| File | Purpose |
|------|--------|
| `sample-rfp-section.txt` | Short RFP-style questions you can paste into a Word document to simulate an RFP and try “Draft Answers.” |
| `sample-rfp-full.txt` | Longer RFP-style document for a more realistic demo. |

## Do we need test data?

- **Word Add-in (UI + Draft Answers):** Yes. You need document content that looks like an RFP (questions or sections to answer). Use the sample files above or your own.
- **MCP servers (SharePoint / Salesforce):** No extra files. The packages use **built-in mock data** (see `packages/mcp-sharepoint` and `packages/mcp-salesforce`). For a live Airia integration you would replace these with real SharePoint/Salesforce or your own test APIs.
- **Teams bot:** No test data files. Use the “Ping Expert” flow and optional Bot Framework Emulator (see main manual testing doc).

## Generating vs downloading test data

- **Use the samples here (recommended for consistency):** Copy `sample-rfp-section.txt` or `sample-rfp-full.txt` into a Word document. Quick and repeatable.
- **Generate your own:** Use [HubSpot RFP templates](https://offers.hubspot.com/rfp-templates), [LawDepot RFP generator](https://lawdepot.com/us/business/request-for-proposals), or similar to create a Word/PDF RFP, then copy sections into Word for the add-in.
- **Download from the internet:** You can use public RFP examples (e.g. government or education templates) as long as you have rights to use them for your demo. Convert to Word if needed and paste the sections you want to test with.

For the hackathon demo, the provided sample RFP text is enough to show “Draft Answers” and the citation widget.
