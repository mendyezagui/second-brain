import PipelinesView from "./PipelinesView";

// Marketing surface = Pipelines (socialCampaigns + contentCalendar, with
// day-by-day activities and document links). The legacy db.campaigns
// metrics-style CRUD tab was retired in the #36 cleanup; the table is kept
// because CRM and document associations still reference campaign records.
export const blankCampaign = () => ({ name:"", type:"Email", status:"draft", leads:0, opens:0, conversions:0, startDate:"" });

export const MarketingView = () => (
  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
    <div style={{ flex:1, overflow:"hidden", minHeight:0 }}>
      <PipelinesView/>
    </div>
  </div>
);
