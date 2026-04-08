/**
 * seed-data.ts
 *
 * Hardcoded, narratively coherent demo data for the Q360 AI Demo.
 *
 * Imported by seed.ts — keeps data separate from seeding logic.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Subtract `days` from `base` and return YYYY-MM-DD */
export function daysAgo(days: number, base: Date = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// ── Customers ────────────────────────────────────────────────────────────────

export const CUSTOMERS = [
  { customerno: "CUST001", company: "Pinnacle Health Systems", type: "Healthcare", status: "Active" },
  { customerno: "CUST002", company: "Wasatch Commercial Properties", type: "Commercial", status: "Active" },
  { customerno: "CUST003", company: "Granite School District", type: "Education", status: "Active" },
  { customerno: "CUST004", company: "SilverCreek Data Solutions", type: "Industrial", status: "Active" },
  { customerno: "CUST005", company: "Alpine Municipal Water Authority", type: "Government", status: "Active" },
  { customerno: "CUST006", company: "Meridian Hotel Group", type: "Commercial", status: "Active" },
  { customerno: "CUST007", company: "Summit Manufacturing Co.", type: "Industrial", status: "Active" },
  { customerno: "CUST008", company: "Redrock Retail Partners", type: "Commercial", status: "Inactive" },
] as const;

// ── Sites ────────────────────────────────────────────────────────────────────

export const SITES = [
  // Pinnacle Health Systems (CUST001)
  { siteno: "SITE001", customerno: "CUST001", sitename: "Pinnacle Medical Center — Main Campus", address: "1250 E 3900 S", city: "Salt Lake City", state: "UT", zip: "84124", phone: "(801) 555-0101" },
  { siteno: "SITE002", customerno: "CUST001", sitename: "Pinnacle Urgent Care — Sandy", address: "9350 S 1300 E", city: "Sandy", state: "UT", zip: "84094", phone: "(801) 555-0102" },
  { siteno: "SITE003", customerno: "CUST001", sitename: "Pinnacle Admin Building", address: "420 Wakara Way", city: "Salt Lake City", state: "UT", zip: "84108", phone: "(801) 555-0103" },

  // Wasatch Commercial Properties (CUST002)
  { siteno: "SITE004", customerno: "CUST002", sitename: "Wasatch Tower — Downtown", address: "222 S Main St", city: "Salt Lake City", state: "UT", zip: "84101", phone: "(801) 555-0201" },
  { siteno: "SITE005", customerno: "CUST002", sitename: "Wasatch Business Park — Draper", address: "13693 S 200 W", city: "Draper", state: "UT", zip: "84020", phone: "(801) 555-0202" },

  // Granite School District (CUST003)
  { siteno: "SITE006", customerno: "CUST003", sitename: "Granite High School", address: "3305 S 500 E", city: "South Salt Lake", state: "UT", zip: "84106", phone: "(801) 555-0301" },
  { siteno: "SITE007", customerno: "CUST003", sitename: "Granite District Admin Office", address: "2500 S State St", city: "Salt Lake City", state: "UT", zip: "84115", phone: "(801) 555-0302" },
  { siteno: "SITE008", customerno: "CUST003", sitename: "Eastmont Elementary", address: "3190 E 7800 S", city: "Cottonwood Heights", state: "UT", zip: "84121", phone: "(801) 555-0303" },

  // SilverCreek Data Solutions (CUST004)
  { siteno: "SITE009", customerno: "CUST004", sitename: "SilverCreek Data Center — Bluffdale", address: "14844 Pony Express Rd", city: "Bluffdale", state: "UT", zip: "84065", phone: "(801) 555-0401" },
  { siteno: "SITE010", customerno: "CUST004", sitename: "SilverCreek NOC — Lehi", address: "2901 Ashton Blvd", city: "Lehi", state: "UT", zip: "84043", phone: "(801) 555-0402" },

  // Alpine Municipal Water Authority (CUST005)
  { siteno: "SITE011", customerno: "CUST005", sitename: "Alpine Water Treatment Plant", address: "600 N 100 E", city: "Alpine", state: "UT", zip: "84004", phone: "(801) 555-0501" },
  { siteno: "SITE012", customerno: "CUST005", sitename: "Highland Pump Station", address: "5400 W 10400 N", city: "Highland", state: "UT", zip: "84003", phone: "(801) 555-0502" },
  { siteno: "SITE013", customerno: "CUST005", sitename: "Lone Peak Reservoir Control Building", address: "9800 N 6800 W", city: "Cedar Hills", state: "UT", zip: "84062", phone: "(801) 555-0503" },

  // Meridian Hotel Group (CUST006)
  { siteno: "SITE014", customerno: "CUST006", sitename: "Meridian Grand Hotel — Downtown", address: "75 S West Temple", city: "Salt Lake City", state: "UT", zip: "84101", phone: "(801) 555-0601" },
  { siteno: "SITE015", customerno: "CUST006", sitename: "Meridian Suites — Park City", address: "2121 Park Ave", city: "Park City", state: "UT", zip: "84060", phone: "(435) 555-0602" },

  // Summit Manufacturing Co. (CUST007)
  { siteno: "SITE016", customerno: "CUST007", sitename: "Summit Factory Floor — West Valley", address: "4100 W 2100 S", city: "West Valley City", state: "UT", zip: "84120", phone: "(801) 555-0701" },
  { siteno: "SITE017", customerno: "CUST007", sitename: "Summit Warehouse & Shipping", address: "5600 W Harold Gatty Dr", city: "Salt Lake City", state: "UT", zip: "84116", phone: "(801) 555-0702" },

  // Redrock Retail Partners (CUST008)
  { siteno: "SITE018", customerno: "CUST008", sitename: "Redrock Distribution Center — Murray", address: "600 W 4800 S", city: "Murray", state: "UT", zip: "84123", phone: "(801) 555-0801" },
  { siteno: "SITE019", customerno: "CUST008", sitename: "Redrock Flagship Store — Fashion Place", address: "6191 S State St", city: "Murray", state: "UT", zip: "84107", phone: "(801) 555-0802" },
  { siteno: "SITE020", customerno: "CUST008", sitename: "Redrock Outlet — Lehi Crossing", address: "3700 N Digital Dr", city: "Lehi", state: "UT", zip: "84043", phone: "(801) 555-0803" },
] as const;

// ── Technicians ──────────────────────────────────────────────────────────────

export const TECHNICIANS = [
  { name: "Maria Chen", specialization: "HVAC & Refrigeration" },
  { name: "James Rodriguez", specialization: "Elevator & Mechanical" },
  { name: "Alex Kim", specialization: "Fire/Life Safety & Security" },
  { name: "Sarah Thompson", specialization: "Electrical & Generator" },
  { name: "Mike Johnson", specialization: "Plumbing & Water Systems" },
  { name: "Lisa Park", specialization: "General Building Maintenance" },
] as const;

// ── Dispatch Templates ───────────────────────────────────────────────────────
//
// Each template defines the "story" fields. Dates are expressed as relative
// offsets (daysAgo) so the seed script can compute actual dates at seed time.
//
// statuscode: OPEN | CLOSED | IN PROGRESS | PENDING | ON HOLD
// cluster: overdue | closed | active | new | hold

export interface DispatchTemplate {
  dispatchno: string;
  callno: string;
  customerno: string;
  siteno: string;
  statuscode: string;
  problem: string;
  solution: string | null;
  priority: number;
  techassigned: string | null;
  openDaysAgo: number;
  closeDaysAgo: number | null;
  estFixDaysAgo: number;
  callername: string;
  calleremail: string;
  callerphone: string;
  description: string;
}

export const DISPATCHES: DispatchTemplate[] = [
  // ── OVERDUE CLUSTER (8) — OPEN/IN PROGRESS, estfixtime in the past ───────

  {
    dispatchno: "D-0001", callno: "C-10001", customerno: "CUST004", siteno: "SITE009",
    statuscode: "OPEN", priority: 1,
    problem: "UPS battery bank failure in primary server hall. Backup power at critical risk. Facility running on utility power only.",
    solution: null, techassigned: null,
    openDaysAgo: 18, closeDaysAgo: null, estFixDaysAgo: 6,
    callername: "Derek Nguyen", calleremail: "d.nguyen@silvercreekdata.com", callerphone: "(801) 555-4401",
    description: "UPS battery bank failure — no backup power",
  },
  {
    dispatchno: "D-0002", callno: "C-10002", customerno: "CUST001", siteno: "SITE001",
    statuscode: "OPEN", priority: 1,
    problem: "HVAC unit not cooling properly in the ICU wing. Temperature rising above safe threshold for patients and sensitive equipment.",
    solution: null, techassigned: null,
    openDaysAgo: 14, closeDaysAgo: null, estFixDaysAgo: 7,
    callername: "Sandra Patel", calleremail: "s.patel@pinnaclehealth.org", callerphone: "(801) 555-1101",
    description: "ICU HVAC failure — patient safety concern",
  },
  {
    dispatchno: "D-0003", callno: "C-10003", customerno: "CUST005", siteno: "SITE012",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "Main distribution pump motor overheating and tripping thermal protection relay. Flow rate dropped 40% to Highland service area.",
    solution: null, techassigned: "Mike Johnson",
    openDaysAgo: 12, closeDaysAgo: null, estFixDaysAgo: 4,
    callername: "Tom Weatherby", calleremail: "t.weatherby@alpinemwa.gov", callerphone: "(801) 555-5501",
    description: "Pump motor overheating — reduced flow rate",
  },
  {
    dispatchno: "D-0004", callno: "C-10004", customerno: "CUST003", siteno: "SITE006",
    statuscode: "OPEN", priority: 2,
    problem: "Fire alarm panel showing fault codes across multiple zones in the gymnasium wing. Annual inspection due in 2 weeks.",
    solution: null, techassigned: "Alex Kim",
    openDaysAgo: 10, closeDaysAgo: null, estFixDaysAgo: 3,
    callername: "Patricia Dunn", calleremail: "p.dunn@graniteschools.org", callerphone: "(801) 555-3301",
    description: "Fire alarm fault codes — gymnasium wing",
  },
  {
    dispatchno: "D-0005", callno: "C-10005", customerno: "CUST006", siteno: "SITE014",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "Elevator #2 stuck between floors 8 and 9. Guests safely evacuated via stairs. Hotel at 95% occupancy for convention weekend.",
    solution: null, techassigned: "James Rodriguez",
    openDaysAgo: 8, closeDaysAgo: null, estFixDaysAgo: 3,
    callername: "Rachel Foster", calleremail: "r.foster@meridianhotels.com", callerphone: "(801) 555-6601",
    description: "Elevator stuck — hotel at near-full occupancy",
  },
  {
    dispatchno: "D-0006", callno: "C-10006", customerno: "CUST007", siteno: "SITE016",
    statuscode: "OPEN", priority: 3,
    problem: "Electrical panel B3 overheating on the assembly line floor. Breaker tripping intermittently causing production line shutdowns.",
    solution: null, techassigned: "Sarah Thompson",
    openDaysAgo: 9, closeDaysAgo: null, estFixDaysAgo: 2,
    callername: "Gary Hendricks", calleremail: "g.hendricks@summitmfg.com", callerphone: "(801) 555-7701",
    description: "Panel overheating — production shutdowns",
  },
  {
    dispatchno: "D-0007", callno: "C-10007", customerno: "CUST004", siteno: "SITE010",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "CRAC unit #4 in NOC showing high discharge temperature alarm. Room temp rising from 68°F to 78°F over past 6 hours.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 5, closeDaysAgo: null, estFixDaysAgo: 2,
    callername: "Jason Lee", calleremail: "j.lee@silvercreekdata.com", callerphone: "(801) 555-4402",
    description: "CRAC unit alarm — NOC temp rising",
  },
  {
    dispatchno: "D-0008", callno: "C-10008", customerno: "CUST002", siteno: "SITE004",
    statuscode: "OPEN", priority: 3,
    problem: "Security camera system offline on floors 12-15. DVR showing disk failure error. No footage recording for 48+ hours.",
    solution: null, techassigned: null,
    openDaysAgo: 7, closeDaysAgo: null, estFixDaysAgo: 2,
    callername: "Megan Ross", calleremail: "m.ross@wasatchcp.com", callerphone: "(801) 555-2201",
    description: "Security cameras offline — no recording",
  },

  // ── RECENTLY CLOSED CLUSTER (18) — problem/solution pairs ────────────────

  {
    dispatchno: "D-0009", callno: "C-10009", customerno: "CUST001", siteno: "SITE002",
    statuscode: "CLOSED", priority: 2,
    problem: "Rooftop HVAC unit making loud grinding noise. Urgent care patients complaining about noise and temperature fluctuations.",
    solution: "Replaced worn compressor bearings and recharged refrigerant to spec. System running at rated capacity, noise eliminated. Recommended scheduling preventive maintenance quarterly.",
    techassigned: "Maria Chen",
    openDaysAgo: 20, closeDaysAgo: 17, estFixDaysAgo: 17,
    callername: "Nancy Gill", calleremail: "n.gill@pinnaclehealth.org", callerphone: "(801) 555-1102",
    description: "HVAC grinding noise — urgent care",
  },
  {
    dispatchno: "D-0010", callno: "C-10010", customerno: "CUST006", siteno: "SITE015",
    statuscode: "CLOSED", priority: 3,
    problem: "Elevator doors not closing fully on the ground floor. Intermittent gap causing safety sensor to hold doors open for 30+ seconds.",
    solution: "Realigned door tracks and replaced worn roller guides. Adjusted gap sensor sensitivity. All floors tested with 50 consecutive open/close cycles — operating normally.",
    techassigned: "James Rodriguez",
    openDaysAgo: 25, closeDaysAgo: 22, estFixDaysAgo: 22,
    callername: "Victor Sandoval", calleremail: "v.sandoval@meridianhotels.com", callerphone: "(435) 555-6602",
    description: "Elevator door alignment issue",
  },
  {
    dispatchno: "D-0011", callno: "C-10011", customerno: "CUST003", siteno: "SITE008",
    statuscode: "CLOSED", priority: 2,
    problem: "Smoke detector in the cafeteria kitchen triggering false alarms during lunch hours. Students being evacuated unnecessarily.",
    solution: "Replaced ionization detector with heat-rate-of-rise detector appropriate for kitchen environment. Tested with simulated cooking conditions — no false triggers. Updated zone map documentation.",
    techassigned: "Alex Kim",
    openDaysAgo: 15, closeDaysAgo: 12, estFixDaysAgo: 12,
    callername: "Julia Marsh", calleremail: "j.marsh@graniteschools.org", callerphone: "(801) 555-3303",
    description: "False fire alarms — elementary cafeteria",
  },
  {
    dispatchno: "D-0012", callno: "C-10012", customerno: "CUST004", siteno: "SITE009",
    statuscode: "CLOSED", priority: 1,
    problem: "Generator failed to start during scheduled weekly test run. Data center relying entirely on utility power with no backup.",
    solution: "Replaced failed starter motor and dead starting battery bank. Performed full 60-minute load test at 80% capacity — generator performing within spec. Scheduled follow-up fuel system inspection.",
    techassigned: "Sarah Thompson",
    openDaysAgo: 30, closeDaysAgo: 28, estFixDaysAgo: 28,
    callername: "Derek Nguyen", calleremail: "d.nguyen@silvercreekdata.com", callerphone: "(801) 555-4401",
    description: "Generator failure — no backup power",
  },
  {
    dispatchno: "D-0013", callno: "C-10013", customerno: "CUST005", siteno: "SITE011",
    statuscode: "CLOSED", priority: 2,
    problem: "Chlorine dosing pump making cavitation noise and delivering inconsistent chemical feed. Water quality readings fluctuating.",
    solution: "Replaced worn pump diaphragm and check valves. Recalibrated flow rate to 2.5 GPH. Verified chlorine residual at 1.2 ppm downstream — within regulatory range. Left spare diaphragm kit on-site.",
    techassigned: "Mike Johnson",
    openDaysAgo: 22, closeDaysAgo: 20, estFixDaysAgo: 20,
    callername: "Tom Weatherby", calleremail: "t.weatherby@alpinemwa.gov", callerphone: "(801) 555-5501",
    description: "Chlorine pump malfunction — water quality",
  },
  {
    dispatchno: "D-0014", callno: "C-10014", customerno: "CUST002", siteno: "SITE005",
    statuscode: "CLOSED", priority: 3,
    problem: "Parking lot lighting fixtures flickering and buzzing in sections A and B. Tenant complaints about safety during evening hours.",
    solution: "Replaced 12 failing LED drivers and 3 corroded wiring connections in junction boxes. All 48 fixtures in sections A and B tested — full brightness, no flicker. Recommended adding surge protectors.",
    techassigned: "Lisa Park",
    openDaysAgo: 18, closeDaysAgo: 16, estFixDaysAgo: 16,
    callername: "Brian Kelley", calleremail: "b.kelley@wasatchcp.com", callerphone: "(801) 555-2202",
    description: "Parking lot lighting flickering",
  },
  {
    dispatchno: "D-0015", callno: "C-10015", customerno: "CUST007", siteno: "SITE017",
    statuscode: "CLOSED", priority: 3,
    problem: "Overhead loading dock door #3 not closing completely. 6-inch gap at bottom allowing weather and pests into warehouse.",
    solution: "Replaced broken bottom seal bracket and weatherstripping. Adjusted spring tension and lubricated tracks. Door sealing fully with no light gaps visible. Inspected other 5 dock doors — all OK.",
    techassigned: "Lisa Park",
    openDaysAgo: 12, closeDaysAgo: 10, estFixDaysAgo: 10,
    callername: "Frank Morrison", calleremail: "f.morrison@summitmfg.com", callerphone: "(801) 555-7702",
    description: "Loading dock door not closing",
  },
  {
    dispatchno: "D-0016", callno: "C-10016", customerno: "CUST001", siteno: "SITE001",
    statuscode: "CLOSED", priority: 1,
    problem: "Medical gas alarm panel showing low oxygen pressure warning in the surgical wing. Surgery schedule at risk if pressure drops further.",
    solution: "Found partially closed isolation valve in the manifold room — opened valve and verified line pressure restored to 55 PSI. Traced root cause to maintenance crew accidentally bumping valve. Added warning tag and lock.",
    techassigned: "Mike Johnson",
    openDaysAgo: 8, closeDaysAgo: 8, estFixDaysAgo: 8,
    callername: "Sandra Patel", calleremail: "s.patel@pinnaclehealth.org", callerphone: "(801) 555-1101",
    description: "Medical gas pressure low — surgical wing",
  },
  {
    dispatchno: "D-0017", callno: "C-10017", customerno: "CUST006", siteno: "SITE014",
    statuscode: "CLOSED", priority: 2,
    problem: "Hot water not reaching rooms on floors 16-20. Guest complaints increasing, several requesting room changes or refunds.",
    solution: "Found failed recirculation pump on the rooftop mechanical level. Replaced pump and bled air from the hot water risers. Verified 120°F water temp at all test fixtures on floors 16-20. Issue fully resolved.",
    techassigned: "Mike Johnson",
    openDaysAgo: 14, closeDaysAgo: 13, estFixDaysAgo: 13,
    callername: "Rachel Foster", calleremail: "r.foster@meridianhotels.com", callerphone: "(801) 555-6601",
    description: "No hot water — upper floors",
  },
  {
    dispatchno: "D-0018", callno: "C-10018", customerno: "CUST003", siteno: "SITE007",
    statuscode: "CLOSED", priority: 3,
    problem: "Badge readers at the main entrance and staff parking gate not recognizing employee badges. Staff having to be manually buzzed in.",
    solution: "Reset access control server and applied firmware update v4.2.1 to all 6 readers. Re-enrolled 12 affected badges. Tested with 20+ employees — all scanning successfully. Root cause: corrupted firmware after power surge.",
    techassigned: "Alex Kim",
    openDaysAgo: 10, closeDaysAgo: 9, estFixDaysAgo: 9,
    callername: "Patricia Dunn", calleremail: "p.dunn@graniteschools.org", callerphone: "(801) 555-3301",
    description: "Badge readers not working — admin office",
  },
  {
    dispatchno: "D-0019", callno: "C-10019", customerno: "CUST004", siteno: "SITE009",
    statuscode: "CLOSED", priority: 2,
    problem: "CRAC unit #2 leaking condensate onto the raised floor near rack row J. Water pooling under server cabinets J-14 through J-18.",
    solution: "Cleared clogged condensate drain line with nitrogen purge. Replaced cracked drain pan. Dried affected area and verified no water damage to cabling. Installed secondary float switch as additional safeguard.",
    techassigned: "Maria Chen",
    openDaysAgo: 35, closeDaysAgo: 33, estFixDaysAgo: 33,
    callername: "Jason Lee", calleremail: "j.lee@silvercreekdata.com", callerphone: "(801) 555-4402",
    description: "CRAC condensate leak — server floor",
  },
  {
    dispatchno: "D-0020", callno: "C-10020", customerno: "CUST007", siteno: "SITE016",
    statuscode: "CLOSED", priority: 2,
    problem: "Compressed air system pressure dropping below 90 PSI during peak production. Assembly tools losing power intermittently.",
    solution: "Found and repaired 3 leaks in distribution piping using ultrasonic leak detector. Replaced worn intake filter on compressor. System now holding 125 PSI steady at full load. Estimated $400/month savings from eliminated leaks.",
    techassigned: "Sarah Thompson",
    openDaysAgo: 28, closeDaysAgo: 25, estFixDaysAgo: 25,
    callername: "Gary Hendricks", calleremail: "g.hendricks@summitmfg.com", callerphone: "(801) 555-7701",
    description: "Compressed air pressure drop — production impact",
  },
  {
    dispatchno: "D-0021", callno: "C-10021", customerno: "CUST005", siteno: "SITE013",
    statuscode: "CLOSED", priority: 3,
    problem: "SCADA system at reservoir control building showing intermittent communication loss with remote sensors. Operators losing visibility for 10-15 minutes at a time.",
    solution: "Replaced corroded antenna cable and weatherproofed junction box. Signal strength improved from -85 dBm to -62 dBm. Monitored for 48 hours with zero communication drops. Scheduled annual antenna inspection.",
    techassigned: "Alex Kim",
    openDaysAgo: 40, closeDaysAgo: 37, estFixDaysAgo: 37,
    callername: "Linda Reyes", calleremail: "l.reyes@alpinemwa.gov", callerphone: "(801) 555-5503",
    description: "SCADA communication loss — reservoir",
  },
  {
    dispatchno: "D-0022", callno: "C-10022", customerno: "CUST002", siteno: "SITE004",
    statuscode: "CLOSED", priority: 3,
    problem: "Plumbing leak detected in the ceiling above the 8th floor lobby. Water staining ceiling tiles and dripping near the reception desk.",
    solution: "Identified burst fitting on the 9th floor restroom supply line. Replaced fitting and 4 feet of corroded copper pipe with PEX. Replaced 6 stained ceiling tiles. Area fully dried — no mold detected.",
    techassigned: "Mike Johnson",
    openDaysAgo: 45, closeDaysAgo: 43, estFixDaysAgo: 43,
    callername: "Megan Ross", calleremail: "m.ross@wasatchcp.com", callerphone: "(801) 555-2201",
    description: "Ceiling leak — 8th floor lobby",
  },
  {
    dispatchno: "D-0023", callno: "C-10023", customerno: "CUST008", siteno: "SITE018",
    statuscode: "CLOSED", priority: 4,
    problem: "Automatic sliding doors at the distribution center main entrance not closing fully. Gap allowing cold air in and triggering HVAC overtime.",
    solution: "Replaced worn bottom guide rollers and adjusted closing speed. Cleaned and lubricated tracks. Doors now closing flush with no gap. Estimated HVAC energy savings of 15% for that zone.",
    techassigned: "Lisa Park",
    openDaysAgo: 35, closeDaysAgo: 34, estFixDaysAgo: 34,
    callername: "Denise Carter", calleremail: "d.carter@redrockretail.com", callerphone: "(801) 555-8801",
    description: "Automatic doors not closing — distribution center",
  },
  {
    dispatchno: "D-0024", callno: "C-10024", customerno: "CUST001", siteno: "SITE003",
    statuscode: "CLOSED", priority: 3,
    problem: "Emergency exit lights on the 2nd and 3rd floors not illuminating during monthly test. Battery backup appears dead in 4 units.",
    solution: "Replaced NiCad battery packs in all 4 affected units. Tested each for 90-minute emergency runtime — all passed. Updated inspection log and affixed new test date stickers.",
    techassigned: "Sarah Thompson",
    openDaysAgo: 20, closeDaysAgo: 19, estFixDaysAgo: 19,
    callername: "Robert Tran", calleremail: "r.tran@pinnaclehealth.org", callerphone: "(801) 555-1103",
    description: "Emergency exit lights — battery failure",
  },
  {
    dispatchno: "D-0025", callno: "C-10025", customerno: "CUST006", siteno: "SITE014",
    statuscode: "CLOSED", priority: 2,
    problem: "Kitchen exhaust hood system not drawing properly. Smoke and cooking odors drifting into the hotel lobby and guest dining area.",
    solution: "Cleaned grease buildup from exhaust duct (8 inches of accumulated grease). Replaced exhaust fan belt and adjusted motor speed. Airflow now measuring 1,200 CFM at hood face — meets code. Scheduled quarterly hood cleaning.",
    techassigned: "Maria Chen",
    openDaysAgo: 16, closeDaysAgo: 14, estFixDaysAgo: 14,
    callername: "Rachel Foster", calleremail: "r.foster@meridianhotels.com", callerphone: "(801) 555-6601",
    description: "Kitchen exhaust — odors in lobby",
  },
  {
    dispatchno: "D-0026", callno: "C-10026", customerno: "CUST007", siteno: "SITE016",
    statuscode: "CLOSED", priority: 2,
    problem: "Overhead crane #1 showing error code E-47 and refusing to travel. Assembly line section 3 production halted.",
    solution: "Replaced failed travel limit switch and recalibrated encoder. Ran crane through full range of motion 20 times with rated load — no faults. Production line 3 back online within 3 hours of arrival.",
    techassigned: "James Rodriguez",
    openDaysAgo: 6, closeDaysAgo: 5, estFixDaysAgo: 5,
    callername: "Gary Hendricks", calleremail: "g.hendricks@summitmfg.com", callerphone: "(801) 555-7701",
    description: "Overhead crane fault — production halted",
  },

  // ── ACTIVE WORK CLUSTER (13) — OPEN/IN PROGRESS, recent, tech assigned ───

  {
    dispatchno: "D-0027", callno: "C-10027", customerno: "CUST001", siteno: "SITE001",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "Chiller plant efficiency dropping — condenser water temp 8°F above setpoint. Energy costs spiking. Suspected fouling in condenser tubes.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 4, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Sandra Patel", calleremail: "s.patel@pinnaclehealth.org", callerphone: "(801) 555-1101",
    description: "Chiller efficiency drop — condenser fouling suspected",
  },
  {
    dispatchno: "D-0028", callno: "C-10028", customerno: "CUST002", siteno: "SITE004",
    statuscode: "IN PROGRESS", priority: 3,
    problem: "Tenant on floor 22 reporting intermittent power flickering in the northeast corner offices. Affecting computer equipment.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 3, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Brian Kelley", calleremail: "b.kelley@wasatchcp.com", callerphone: "(801) 555-2202",
    description: "Power flickering — floor 22 offices",
  },
  {
    dispatchno: "D-0029", callno: "C-10029", customerno: "CUST003", siteno: "SITE006",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "Gymnasium HVAC rooftop unit not heating. Students and staff reporting 58°F temperatures during morning PE classes.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 2, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Julia Marsh", calleremail: "j.marsh@graniteschools.org", callerphone: "(801) 555-3303",
    description: "Gym HVAC not heating — cold classrooms",
  },
  {
    dispatchno: "D-0030", callno: "C-10030", customerno: "CUST004", siteno: "SITE009",
    statuscode: "IN PROGRESS", priority: 1,
    problem: "Fire suppression pre-action system showing low air pressure in Zone C. Covers 200 server racks. System may not activate properly if needed.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 2, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Derek Nguyen", calleremail: "d.nguyen@silvercreekdata.com", callerphone: "(801) 555-4401",
    description: "Fire suppression low pressure — data center",
  },
  {
    dispatchno: "D-0031", callno: "C-10031", customerno: "CUST005", siteno: "SITE011",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "Variable frequency drive on the raw water intake pump showing fault code F-31. Pump running at fixed speed, unable to modulate flow.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 3, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Tom Weatherby", calleremail: "t.weatherby@alpinemwa.gov", callerphone: "(801) 555-5501",
    description: "VFD fault — raw water pump",
  },
  {
    dispatchno: "D-0032", callno: "C-10032", customerno: "CUST006", siteno: "SITE015",
    statuscode: "IN PROGRESS", priority: 3,
    problem: "In-room thermostats on the 3rd floor not communicating with the BMS. Guests unable to adjust room temperature.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 2, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Victor Sandoval", calleremail: "v.sandoval@meridianhotels.com", callerphone: "(435) 555-6602",
    description: "Thermostats offline — 3rd floor guest rooms",
  },
  {
    dispatchno: "D-0033", callno: "C-10033", customerno: "CUST007", siteno: "SITE016",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "Dust collection system ductwork separated at a joint above CNC machine area. Sawdust accumulating on equipment and floor — fire hazard.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 1, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Frank Morrison", calleremail: "f.morrison@summitmfg.com", callerphone: "(801) 555-7702",
    description: "Dust collection ductwork separated — fire hazard",
  },
  {
    dispatchno: "D-0034", callno: "C-10034", customerno: "CUST002", siteno: "SITE005",
    statuscode: "IN PROGRESS", priority: 3,
    problem: "Rooftop solar panel inverter showing ground fault alarm. Panels offline, not generating power. Annual energy savings at risk.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 4, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Megan Ross", calleremail: "m.ross@wasatchcp.com", callerphone: "(801) 555-2201",
    description: "Solar inverter ground fault",
  },
  {
    dispatchno: "D-0035", callno: "C-10035", customerno: "CUST001", siteno: "SITE002",
    statuscode: "OPEN", priority: 3,
    problem: "Waiting room ventilation fan running continuously at high speed regardless of thermostat setting. Patients reporting cold drafts.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 3, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Nancy Gill", calleremail: "n.gill@pinnaclehealth.org", callerphone: "(801) 555-1102",
    description: "Ventilation fan stuck on high — waiting room",
  },
  {
    dispatchno: "D-0036", callno: "C-10036", customerno: "CUST005", siteno: "SITE013",
    statuscode: "IN PROGRESS", priority: 3,
    problem: "Reservoir level sensor reading erratic values. Operators cannot trust water level data for distribution scheduling.",
    solution: null, techassigned: "Mike Johnson",
    openDaysAgo: 5, closeDaysAgo: null, estFixDaysAgo: -2,
    callername: "Linda Reyes", calleremail: "l.reyes@alpinemwa.gov", callerphone: "(801) 555-5503",
    description: "Level sensor erratic — reservoir",
  },
  {
    dispatchno: "D-0037", callno: "C-10037", customerno: "CUST003", siteno: "SITE008",
    statuscode: "OPEN", priority: 3,
    problem: "Playground area security camera knocked offline after windstorm. Camera mount appears damaged. School administration requesting repair before Monday.",
    solution: null, techassigned: "Alex Kim",
    openDaysAgo: 2, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Julia Marsh", calleremail: "j.marsh@graniteschools.org", callerphone: "(801) 555-3303",
    description: "Security camera down — playground",
  },
  {
    dispatchno: "D-0038", callno: "C-10038", customerno: "CUST004", siteno: "SITE010",
    statuscode: "IN PROGRESS", priority: 2,
    problem: "Raised floor tiles in the hot aisle cracked and misaligned after recent equipment move. Airflow containment compromised.",
    solution: null, techassigned: "Lisa Park",
    openDaysAgo: 3, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Jason Lee", calleremail: "j.lee@silvercreekdata.com", callerphone: "(801) 555-4402",
    description: "Raised floor tiles cracked — hot aisle",
  },
  {
    dispatchno: "D-0039", callno: "C-10039", customerno: "CUST006", siteno: "SITE014",
    statuscode: "IN PROGRESS", priority: 3,
    problem: "Ballroom chandelier dimming system not responding to controls. Upcoming wedding event requires full lighting control capability.",
    solution: null, techassigned: "Sarah Thompson",
    openDaysAgo: 1, closeDaysAgo: null, estFixDaysAgo: -2,
    callername: "Rachel Foster", calleremail: "r.foster@meridianhotels.com", callerphone: "(801) 555-6601",
    description: "Ballroom dimmer failure — event upcoming",
  },

  // ── NEW CALLS CLUSTER (7) — OPEN, very recent, some unassigned ───────────

  {
    dispatchno: "D-0040", callno: "C-10040", customerno: "CUST001", siteno: "SITE001",
    statuscode: "OPEN", priority: 2,
    problem: "Pneumatic tube system between pharmacy and ICU jammed. Medication deliveries being hand-carried, causing 15-minute delays.",
    solution: null, techassigned: null,
    openDaysAgo: 0, closeDaysAgo: null, estFixDaysAgo: -2,
    callername: "Sandra Patel", calleremail: "s.patel@pinnaclehealth.org", callerphone: "(801) 555-1101",
    description: "Pneumatic tube jammed — pharmacy to ICU",
  },
  {
    dispatchno: "D-0041", callno: "C-10041", customerno: "CUST007", siteno: "SITE017",
    statuscode: "OPEN", priority: 3,
    problem: "Forklift charging station #2 showing fault light. Unable to charge 3 of 8 electric forklifts. Shipping operations slowing down.",
    solution: null, techassigned: null,
    openDaysAgo: 0, closeDaysAgo: null, estFixDaysAgo: -2,
    callername: "Frank Morrison", calleremail: "f.morrison@summitmfg.com", callerphone: "(801) 555-7702",
    description: "Forklift charger fault — shipping impact",
  },
  {
    dispatchno: "D-0042", callno: "C-10042", customerno: "CUST002", siteno: "SITE004",
    statuscode: "OPEN", priority: 4,
    problem: "Lobby water feature pump making noise. Cosmetic issue only — no water damage or safety concern. Building manager requests service at next available window.",
    solution: null, techassigned: "Lisa Park",
    openDaysAgo: 1, closeDaysAgo: null, estFixDaysAgo: -5,
    callername: "Megan Ross", calleremail: "m.ross@wasatchcp.com", callerphone: "(801) 555-2201",
    description: "Lobby fountain pump noise",
  },
  {
    dispatchno: "D-0043", callno: "C-10043", customerno: "CUST003", siteno: "SITE007",
    statuscode: "OPEN", priority: 2,
    problem: "Boiler room smoke detector chirping — low battery warning. District safety policy requires immediate response to any fire system alerts.",
    solution: null, techassigned: "Alex Kim",
    openDaysAgo: 0, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Patricia Dunn", calleremail: "p.dunn@graniteschools.org", callerphone: "(801) 555-3301",
    description: "Smoke detector low battery — boiler room",
  },
  {
    dispatchno: "D-0044", callno: "C-10044", customerno: "CUST008", siteno: "SITE019",
    statuscode: "OPEN", priority: 3,
    problem: "Refrigeration display case in the flagship store running warm. Product temperature approaching spoilage threshold.",
    solution: null, techassigned: null,
    openDaysAgo: 0, closeDaysAgo: null, estFixDaysAgo: -1,
    callername: "Denise Carter", calleremail: "d.carter@redrockretail.com", callerphone: "(801) 555-8801",
    description: "Refrigeration case warm — spoilage risk",
  },
  {
    dispatchno: "D-0045", callno: "C-10045", customerno: "CUST004", siteno: "SITE009",
    statuscode: "OPEN", priority: 2,
    problem: "PDU in rack row M showing phase imbalance warning. Load needs redistribution before adding new servers planned for next week.",
    solution: null, techassigned: "Sarah Thompson",
    openDaysAgo: 1, closeDaysAgo: null, estFixDaysAgo: -3,
    callername: "Derek Nguyen", calleremail: "d.nguyen@silvercreekdata.com", callerphone: "(801) 555-4401",
    description: "PDU phase imbalance — server expansion blocked",
  },
  {
    dispatchno: "D-0046", callno: "C-10046", customerno: "CUST005", siteno: "SITE012",
    statuscode: "OPEN", priority: 2,
    problem: "Emergency backup generator at the pump station failed to auto-transfer during a brief power outage. Pumps went offline for 12 minutes.",
    solution: null, techassigned: null,
    openDaysAgo: 1, closeDaysAgo: null, estFixDaysAgo: -2,
    callername: "Tom Weatherby", calleremail: "t.weatherby@alpinemwa.gov", callerphone: "(801) 555-5501",
    description: "ATS failure — pump station lost power",
  },

  // ── ON HOLD / PENDING CLUSTER (4) ────────────────────────────────────────

  {
    dispatchno: "D-0047", callno: "C-10047", customerno: "CUST006", siteno: "SITE014",
    statuscode: "ON HOLD", priority: 3,
    problem: "Rooftop cooling tower fan blade showing vibration. Running at reduced speed to prevent further damage. Full replacement parts on order — 2 week lead time from manufacturer.",
    solution: null, techassigned: "Maria Chen",
    openDaysAgo: 10, closeDaysAgo: null, estFixDaysAgo: -7,
    callername: "Rachel Foster", calleremail: "r.foster@meridianhotels.com", callerphone: "(801) 555-6601",
    description: "Cooling tower fan vibration — parts on order",
  },
  {
    dispatchno: "D-0048", callno: "C-10048", customerno: "CUST007", siteno: "SITE016",
    statuscode: "PENDING", priority: 3,
    problem: "Paint booth exhaust filters need replacement — airflow below minimum code requirement. Production painting suspended until resolved. Filters are special-order items.",
    solution: null, techassigned: "Lisa Park",
    openDaysAgo: 8, closeDaysAgo: null, estFixDaysAgo: -3,
    callername: "Gary Hendricks", calleremail: "g.hendricks@summitmfg.com", callerphone: "(801) 555-7701",
    description: "Paint booth filters — special order pending",
  },
  {
    dispatchno: "D-0049", callno: "C-10049", customerno: "CUST008", siteno: "SITE020",
    statuscode: "PENDING", priority: 4,
    problem: "Exterior signage lighting on the west face not illuminating. Waiting for landlord approval to access shared electrical panel for repair.",
    solution: null, techassigned: "Sarah Thompson",
    openDaysAgo: 15, closeDaysAgo: null, estFixDaysAgo: -5,
    callername: "Denise Carter", calleremail: "d.carter@redrockretail.com", callerphone: "(801) 555-8801",
    description: "Exterior sign lighting — awaiting landlord access",
  },
  {
    dispatchno: "D-0050", callno: "C-10050", customerno: "CUST002", siteno: "SITE005",
    statuscode: "ON HOLD", priority: 3,
    problem: "EV charging stations 3 and 4 showing communication error with payment system. Tenant can still use stations 1 and 2. Vendor support ticket open with ChargePoint.",
    solution: null, techassigned: null,
    openDaysAgo: 12, closeDaysAgo: null, estFixDaysAgo: -4,
    callername: "Brian Kelley", calleremail: "b.kelley@wasatchcp.com", callerphone: "(801) 555-2202",
    description: "EV chargers offline — vendor ticket open",
  },
];

// ── TimeBill Templates ───────────────────────────────────────────────────────

export interface TimeBillTemplate {
  timebillno: string;
  userid: string;
  dispatchno: string;
  customerno: string;
  daysAgo: number;
  timebilled: number;
  rate: number;
  category: string;
}

export const TIMEBILLS: TimeBillTemplate[] = [
  // Closed dispatch timebills
  { timebillno: "TB-0001", userid: "Maria Chen", dispatchno: "D-0009", customerno: "CUST001", daysAgo: 18, timebilled: 3.5, rate: 95, category: "HVAC" },
  { timebillno: "TB-0002", userid: "Maria Chen", dispatchno: "D-0009", customerno: "CUST001", daysAgo: 17, timebilled: 2.0, rate: 95, category: "HVAC" },
  { timebillno: "TB-0003", userid: "James Rodriguez", dispatchno: "D-0010", customerno: "CUST006", daysAgo: 24, timebilled: 4.0, rate: 105, category: "Elevator" },
  { timebillno: "TB-0004", userid: "James Rodriguez", dispatchno: "D-0010", customerno: "CUST006", daysAgo: 23, timebilled: 2.5, rate: 105, category: "Elevator" },
  { timebillno: "TB-0005", userid: "Alex Kim", dispatchno: "D-0011", customerno: "CUST003", daysAgo: 14, timebilled: 3.0, rate: 90, category: "Fire Safety" },
  { timebillno: "TB-0006", userid: "Sarah Thompson", dispatchno: "D-0012", customerno: "CUST004", daysAgo: 29, timebilled: 6.0, rate: 110, category: "Generator" },
  { timebillno: "TB-0007", userid: "Sarah Thompson", dispatchno: "D-0012", customerno: "CUST004", daysAgo: 28, timebilled: 4.0, rate: 110, category: "Generator" },
  { timebillno: "TB-0008", userid: "Mike Johnson", dispatchno: "D-0013", customerno: "CUST005", daysAgo: 21, timebilled: 3.5, rate: 85, category: "Plumbing" },
  { timebillno: "TB-0009", userid: "Lisa Park", dispatchno: "D-0014", customerno: "CUST002", daysAgo: 17, timebilled: 5.0, rate: 80, category: "Electrical" },
  { timebillno: "TB-0010", userid: "Lisa Park", dispatchno: "D-0015", customerno: "CUST007", daysAgo: 11, timebilled: 2.5, rate: 80, category: "General" },
  { timebillno: "TB-0011", userid: "Mike Johnson", dispatchno: "D-0016", customerno: "CUST001", daysAgo: 8, timebilled: 1.5, rate: 85, category: "Medical Gas" },
  { timebillno: "TB-0012", userid: "Mike Johnson", dispatchno: "D-0017", customerno: "CUST006", daysAgo: 13, timebilled: 4.0, rate: 85, category: "Plumbing" },
  { timebillno: "TB-0013", userid: "Alex Kim", dispatchno: "D-0018", customerno: "CUST003", daysAgo: 10, timebilled: 3.0, rate: 90, category: "Security" },
  { timebillno: "TB-0014", userid: "Maria Chen", dispatchno: "D-0019", customerno: "CUST004", daysAgo: 34, timebilled: 4.5, rate: 95, category: "HVAC" },
  { timebillno: "TB-0015", userid: "Sarah Thompson", dispatchno: "D-0020", customerno: "CUST007", daysAgo: 27, timebilled: 5.0, rate: 110, category: "Mechanical" },
  { timebillno: "TB-0016", userid: "Alex Kim", dispatchno: "D-0021", customerno: "CUST005", daysAgo: 39, timebilled: 3.5, rate: 90, category: "SCADA" },
  { timebillno: "TB-0017", userid: "Mike Johnson", dispatchno: "D-0022", customerno: "CUST002", daysAgo: 44, timebilled: 6.0, rate: 85, category: "Plumbing" },
  { timebillno: "TB-0018", userid: "Lisa Park", dispatchno: "D-0023", customerno: "CUST008", daysAgo: 35, timebilled: 1.5, rate: 80, category: "General" },
  { timebillno: "TB-0019", userid: "Sarah Thompson", dispatchno: "D-0024", customerno: "CUST001", daysAgo: 19, timebilled: 2.0, rate: 110, category: "Electrical" },
  { timebillno: "TB-0020", userid: "Maria Chen", dispatchno: "D-0025", customerno: "CUST006", daysAgo: 15, timebilled: 4.0, rate: 95, category: "HVAC" },
  { timebillno: "TB-0021", userid: "James Rodriguez", dispatchno: "D-0026", customerno: "CUST007", daysAgo: 6, timebilled: 3.0, rate: 105, category: "Mechanical" },
];

// ── Task Templates ───────────────────────────────────────────────────────────

export interface TaskTemplate {
  taskid: string;
  userid: string;
  title: string;
  priority: number;
  endDaysFromNow: number;
  completedDaysAgo: number | null;
}

export const TASKS: TaskTemplate[] = [
  // Maria Chen's tasks (primary employee view)
  { taskid: "TASK-001", userid: "Maria Chen", title: "Confirm replacement compressor delivery for Pinnacle Urgent Care", priority: 1, endDaysFromNow: 2, completedDaysAgo: null },
  { taskid: "TASK-002", userid: "Maria Chen", title: "Upload inspection photos from SilverCreek NOC CRAC unit visit", priority: 2, endDaysFromNow: 1, completedDaysAgo: null },
  { taskid: "TASK-003", userid: "Maria Chen", title: "Submit refrigerant usage log for EPA compliance — Q1 2026", priority: 2, endDaysFromNow: 5, completedDaysAgo: null },
  { taskid: "TASK-004", userid: "Maria Chen", title: "Follow up with Meridian Hotel on cooling tower fan blade ETA", priority: 3, endDaysFromNow: 3, completedDaysAgo: null },
  { taskid: "TASK-005", userid: "Maria Chen", title: "Complete safety refresher training — due by end of month", priority: 3, endDaysFromNow: 25, completedDaysAgo: null },
  { taskid: "TASK-006", userid: "Maria Chen", title: "Review condenser coil cleaning procedure update from vendor", priority: 4, endDaysFromNow: 7, completedDaysAgo: 3 },
  { taskid: "TASK-007", userid: "Maria Chen", title: "Order replacement filters for Wasatch Tower AHU-3", priority: 2, endDaysFromNow: -2, completedDaysAgo: 5 },
  { taskid: "TASK-008", userid: "Maria Chen", title: "Submit weekly timesheet for approval", priority: 1, endDaysFromNow: 0, completedDaysAgo: null },

  // Other technicians' tasks
  { taskid: "TASK-009", userid: "James Rodriguez", title: "Schedule elevator certification inspection — Meridian Suites", priority: 2, endDaysFromNow: 10, completedDaysAgo: null },
  { taskid: "TASK-010", userid: "Alex Kim", title: "Prepare fire alarm inspection report for Granite School District", priority: 1, endDaysFromNow: 3, completedDaysAgo: null },
  { taskid: "TASK-011", userid: "Sarah Thompson", title: "Coordinate generator load bank test with SilverCreek IT team", priority: 2, endDaysFromNow: 7, completedDaysAgo: null },
  { taskid: "TASK-012", userid: "Mike Johnson", title: "Order replacement diaphragm kits for Alpine dosing pumps", priority: 3, endDaysFromNow: 5, completedDaysAgo: 2 },
  { taskid: "TASK-013", userid: "Lisa Park", title: "Update preventive maintenance schedule for Wasatch Business Park", priority: 3, endDaysFromNow: 10, completedDaysAgo: null },
  { taskid: "TASK-014", userid: "Mike Johnson", title: "Review Highland pump station flow data for quarterly report", priority: 2, endDaysFromNow: 4, completedDaysAgo: null },
  { taskid: "TASK-015", userid: "Sarah Thompson", title: "Test ATS transfer time at Highland Pump Station", priority: 1, endDaysFromNow: 2, completedDaysAgo: null },
];
